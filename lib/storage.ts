import { type User, type InsertUser, type Lens, type InsertLens, type UserLens, type InsertUserLens } from "../shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getLenses(): Promise<Lens[]>;
  getLens(id: string): Promise<Lens | undefined>;
  createLens(lens: InsertLens): Promise<Lens>;
  
  getUserLenses(userId: string): Promise<(UserLens & { lens: Lens })[]>;
  addUserLens(userLens: InsertUserLens): Promise<UserLens>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private lenses: Map<string, Lens>;
  private userLenses: Map<string, UserLens>;

  constructor() {
    this.users = new Map();
    this.lenses = new Map();
    this.userLenses = new Map();
    
    // Initialize with some default lenses
    this.initializeDefaultLenses();
  }

  private initializeDefaultLenses() {
    const defaultLenses: Lens[] = [
      {
        id: "1",
        name: "Saga Lens",
        description: "Professional AR lens with advanced effects and real-time processing.",
        creator: "saga_creator",
        downloads: 12500,
        snapLensId: "c0858ad5-11f4-4ba8-b7b9-edb9b64a2164",
        snapGroupId: "cd486701-b5b7-42f3-b809-f4cc276d5e7b",
        category: "portrait",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "2",
        name: "ETHGlobal Lens",
        description: "Blockchain-inspired AR effects with digital overlays and futuristic elements.",
        creator: "ethglobal_team",
        downloads: 8200,
        snapLensId: "ce43cc27-559c-4196-8614-fa0b153a83ce",
        snapGroupId: "cd486701-b5b7-42f3-b809-f4cc276d5e7b",
        category: "creative",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "3",
        name: "Diamond",
        description: "Elegant diamond overlay with sparkling effects.",
        creator: "luxury_creator",
        downloads: 15000,
        snapLensId: "b9e1c7d2-4f3a-4e8b-9c5d-6a7e8f9g0h1i",
        snapGroupId: "cd486701-b5b7-42f3-b809-f4cc276d5e7b",
        category: "beauty",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "4",
        name: "Neon City",
        description: "Cyberpunk-inspired neon overlays and urban effects.",
        creator: "cyber_artist",
        downloads: 9300,
        snapLensId: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
        snapGroupId: "cd486701-b5b7-42f3-b809-f4cc276d5e7b",
        category: "creative",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "5",
        name: "Coinbase",
        description: "Coinbase-branded AR lens with crypto-themed effects and overlays.",
        creator: "coinbase_team",
        downloads: 18500,
        snapLensId: "559fdbf0-159e-4051-94a8-4bf41382afd1",
        snapGroupId: "cd486701-b5b7-42f3-b809-f4cc276d5e7b",
        category: "brand",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "6",
        name: "POAP",
        description: "Proof of Attendance Protocol lens with collectible and event-themed AR effects.",
        creator: "poap_team",
        downloads: 11200,
        snapLensId: "5aff4746-26d4-4415-8be7-002c57634c85",
        snapGroupId: "cd486701-b5b7-42f3-b809-f4cc276d5e7b",
        category: "event",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "7",
        name: "Racing",
        description: "High-speed racing effects with dynamic motion blur and speed overlays.",
        creator: "racing_studio",
        downloads: 14800,
        snapLensId: "6a84bbb7-1c9d-4108-976b-846068770714",
        snapGroupId: "cd486701-b5b7-42f3-b809-f4cc276d5e7b",
        category: "sports",
        isActive: true,
        createdAt: new Date(),
      }
    ];

    defaultLenses.forEach(lens => {
      this.lenses.set(lens.id, lens);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      ...insertUser,
    };
    this.users.set(id, user);
    return user;
  }

  async getLenses(): Promise<Lens[]> {
    return Array.from(this.lenses.values()).filter(lens => lens.isActive);
  }

  async getLens(id: string): Promise<Lens | undefined> {
    return this.lenses.get(id);
  }

  async createLens(insertLens: InsertLens): Promise<Lens> {
    const id = randomUUID();
    const lens: Lens = {
      id,
      name: insertLens.name,
      description: insertLens.description ?? null,
      creator: insertLens.creator,
      downloads: insertLens.downloads ?? null,
      snapLensId: insertLens.snapLensId,
      snapGroupId: insertLens.snapGroupId ?? null,
      category: insertLens.category ?? null,
      isActive: insertLens.isActive ?? null,
      createdAt: new Date(),
    };
    this.lenses.set(id, lens);
    return lens;
  }

  async getUserLenses(userId: string): Promise<(UserLens & { lens: Lens })[]> {
    const userLenses = Array.from(this.userLenses.values()).filter(
      (userLens) => userLens.userId === userId,
    );

    return userLenses.map((userLens) => {
      const lens = this.lenses.get(userLens.lensId);
      if (!lens) {
        throw new Error(`Lens with id ${userLens.lensId} not found`);
      }
      return { ...userLens, lens };
    });
  }

  async addUserLens(insertUserLens: InsertUserLens): Promise<UserLens> {
    const id = randomUUID();
    const userLens: UserLens = {
      id,
      ...insertUserLens,
      purchasedAt: new Date(),
    };
    this.userLenses.set(id, userLens);
    return userLens;
  }
}

// Create singleton instance
export const storage = new MemStorage();