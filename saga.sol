
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal IERC20 interface
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from,address to,uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

/// @notice Minimal Ownable
abstract contract Ownable {
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    address public owner;
    constructor() { owner = msg.sender; emit OwnershipTransferred(address(0), msg.sender); }
    modifier onlyOwner() { require(msg.sender == owner, "NOT_OWNER"); _; }
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_ADDR");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

/// @notice Minimal ReentrancyGuard
abstract contract ReentrancyGuard {
    uint256 private _entered = 1;
    modifier nonReentrant() {
        require(_entered == 1, "REENTRANT");
        _entered = 2;
        _;
        _entered = 1;
    }
}

/**
 * @title LenzLikeAndGames
 * @notice Press-like tipping + simple staking game pools.
 * - If token == address(0): uses native chain coin (e.g., LENZ as gas coin).
 * - Else: uses ERC20 at `token`.
 */
contract LenzLikeAndGames is Ownable, ReentrancyGuard {
    address public immutable token; // address(0) => native mode

    // ===== Events =====
    event LikedNative(address indexed from, address indexed to, uint256 amount);
    event LikedERC20(address indexed from, address indexed to, uint256 amount);
    event GameCreated(uint256 indexed gameId, address indexed creator, uint256 requiredStake, bool isERC20);
    event Joined(uint256 indexed gameId, address indexed player, uint256 amount);
    event OwnerToppedUp(uint256 indexed gameId, uint256 amount);
    event Resolved(uint256 indexed gameId, address[] winners, uint256 totalPaid);
    event OwnerWithdrawn(uint256 indexed gameId, uint256 amount);

    // ===== Game storage =====
    struct Game {
        address creator;
        uint256 requiredStake;     // fixed buy-in per player
        uint256 pool;              // total tokens/coin held by contract for this game
        bool resolved;
        bool isERC20;
        address[] players;
        mapping(address => uint256) stakeOf; // amount each player put in
    }

    uint256 public nextGameId;
    mapping(uint256 => Game) private games;

    constructor(address _token /* address(0) => native */) {
        token = _token;
    }

    // ===== Like-to-tip =====

    /// @notice Tip with native coin. Only available if token == address(0).
    function likeNative(address to) external payable nonReentrant {
        require(token == address(0), "NATIVE_ONLY");
        require(to != address(0), "BAD_TO");
        require(msg.value > 0, "NO_VALUE");
        (bool ok, ) = payable(to).call{value: msg.value}("");
        require(ok, "SEND_FAIL");
        emit LikedNative(msg.sender, to, msg.value);
    }

    /// @notice Tip with ERC20. Only available if token != address(0).
    function likeERC20(address to, uint256 amount) external nonReentrant {
        require(token != address(0), "ERC20_ONLY");
        require(to != address(0), "BAD_TO");
        require(amount > 0, "NO_AMOUNT");
        require(IERC20(token).transferFrom(msg.sender, to, amount), "TRANSFER_FROM_FAIL");
        emit LikedERC20(msg.sender, to, amount);
    }

    // ===== Games =====

    /// @notice Create a game with a fixed stake. Anyone can create; resolution is owner-only.
    /// @param requiredStake The exact stake to join (in wei or token units).
    function createGame(uint256 requiredStake) external returns (uint256 gameId) {
        require(requiredStake > 0, "STAKE_ZERO");
        gameId = nextGameId++;
        Game storage g = games[gameId];
        g.creator = msg.sender;
        g.requiredStake = requiredStake;
        g.isERC20 = (token != address(0));
        emit GameCreated(gameId, msg.sender, requiredStake, g.isERC20);
    }

    /// @notice Join a game by staking the exact required amount (native).
    function joinNative(uint256 gameId) external payable nonReentrant {
        require(token == address(0), "NATIVE_ONLY");
        Game storage g = games[gameId];
        require(!g.resolved, "RESOLVED");
        require(msg.value == g.requiredStake && msg.value > 0, "BAD_VALUE");
        if (g.stakeOf[msg.sender] == 0) g.players.push(msg.sender);
        g.stakeOf[msg.sender] += msg.value;
        g.pool += msg.value;
        emit Joined(gameId, msg.sender, msg.value);
    }

    /// @notice Join a game by staking the exact required amount (ERC20).
    function joinERC20(uint256 gameId) external nonReentrant {
        require(token != address(0), "ERC20_ONLY");
        Game storage g = games[gameId];
        require(!g.resolved, "RESOLVED");
        uint256 amt = g.requiredStake;
        require(amt > 0, "STAKE_ZERO");
        if (g.stakeOf[msg.sender] == 0) g.players.push(msg.sender);
        g.stakeOf[msg.sender] += amt;
        require(IERC20(token).transferFrom(msg.sender, address(this), amt), "TRANSFER_FROM_FAIL");
        g.pool += amt;
        emit Joined(gameId, msg.sender, amt);
    }

    /// @notice Team can add extra rewards to a game's pool before resolution.
    function ownerTopUpNative(uint256 gameId) external payable onlyOwner nonReentrant {
        require(token == address(0), "NATIVE_ONLY");
        require(msg.value > 0, "NO_VALUE");
        Game storage g = games[gameId];
        require(!g.resolved, "RESOLVED");
        g.pool += msg.value;
        emit OwnerToppedUp(gameId, msg.value);
    }

    function ownerTopUpERC20(uint256 gameId, uint256 amount) external onlyOwner nonReentrant {
        require(token != address(0), "ERC20_ONLY");
        require(amount > 0, "NO_AMOUNT");
        Game storage g = games[gameId];
        require(!g.resolved, "RESOLVED");
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "TRANSFER_FROM_FAIL");
        g.pool += amount;
        emit OwnerToppedUp(gameId, amount);
    }

    /// @notice (Owner) Resolve winners: each winner gets their stake back + equal share of the remainder.
    /// Losers' stakes remain in the pool (i.e., get distributed).
    /// @dev Winners must have joined. Cannot be called twice.
    function resolveGame(uint256 gameId, address[] calldata winners) external onlyOwner nonReentrant {
        Game storage g = games[gameId];
        require(!g.resolved, "RESOLVED");
        require(winners.length > 0, "NO_WINNERS");

        // Validate winners participated
        uint256 winnersStakes = 0;
        for (uint256 i = 0; i < winners.length; i++) {
            address w = winners[i];
            uint256 s = g.stakeOf[w];
            require(s > 0, "WINNER_NOT_PLAYER");
            winnersStakes += s;
        }

        uint256 totalPool = g.pool;
        require(totalPool > 0, "POOL_EMPTY");

        // Pay back winners' own stakes first, then split remaining equally.
        uint256 remainder = totalPool - winnersStakes;
        uint256 bonusEach = remainder / winners.length; // any dust stays locked; see note below
        uint256 totalPaid;

        for (uint256 i = 0; i < winners.length; i++) {
            address w = winners[i];
            uint256 payout = g.stakeOf[w] + bonusEach;
            totalPaid += payout;

            if (token == address(0)) {
                (bool ok, ) = payable(w).call{value: payout}("");
                require(ok, "PAY_FAIL");
            } else {
                require(IERC20(token).transfer(w, payout), "TOKEN_PAY_FAIL");
            }
        }

        // Reduce pool & mark resolved
        // Any tiny remainder from integer division remains in the contract as dust; owner can withdraw before/after as below.
        g.pool = 0;
        g.resolved = true;

        emit Resolved(gameId, winners, totalPaid);
    }

    /// @notice (Owner) Withdraw unallocated/dust funds from a game after resolution OR to cancel a game.
    function ownerWithdrawFromGame(uint256 gameId, uint256 amount) external onlyOwner nonReentrant {
        Game storage g = games[gameId];
        uint256 avail = g.pool;
        require(amount > 0 && amount <= avail, "BAD_AMOUNT");
        g.pool -= amount;
        if (token == address(0)) {
            (bool ok, ) = payable(owner).call{value: amount}("");
            require(ok, "WITHDRAW_FAIL");
        } else {
            require(IERC20(token).transfer(owner, amount), "TOKEN_WITHDRAW_FAIL");
        }
        emit OwnerWithdrawn(gameId, amount);
    }

    // ===== Views & helpers =====

    function getGame(uint256 gameId) external view returns (
        address _creator,
        uint256 _requiredStake,
        uint256 _pool,
        bool _resolved,
        bool _isERC20,
        uint256 playerCount
    ) {
        Game storage g = games[gameId];
        return (g.creator, g.requiredStake, g.pool, g.resolved, g.isERC20, g.players.length);
    }

    function getPlayers(uint256 gameId) external view returns (address[] memory) {
        return games[gameId].players;
    }

    function stakeOf(uint256 gameId, address player) external view returns (uint256) {
        return games[gameId].stakeOf[player];
    }

    // Allow receiving native top-ups sent directly to the contract (counts as no game).
    receive() external payable {}
}
