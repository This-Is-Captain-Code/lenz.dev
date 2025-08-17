import { type User, type InsertUser, type Lens, type InsertLens, type UserLens, type InsertUserLens } from "@shared/schema";
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
        name: "Golden Hour",
        description: "Transform your photos with warm, golden lighting that creates a magical sunset atmosphere. Perfect for portraits and lifestyle shots.",
        creator: "lenz_studio",
        downloads: 12500,
        snapLensId: "49a28a50-9294-475b-bdb5-d0b7395109e2",
        snapGroupId: "b5551368-7881-4a23-a034-a0e757ec85a7",
        category: "portrait",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "2",
        name: "Cyberpunk",
        description: "Add futuristic neon vibes to your photos with electric blue and magenta overlays.",
        creator: "techartist",
        downloads: 8200,
        snapLensId: "22d39571-e721-4687-aae1-67dc235c479b",
        snapGroupId: "b5551368-7881-4a23-a034-a0e757ec85a7",
        category: "creative",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "3",
        name: "Dreamy Pastel",
        description: "Soft pastel colors that create an ethereal, dreamy atmosphere for your photos.",
        creator: "dreamstudio",
        downloads: 15100,
        snapLensId: "dreamy-pastel-id",
        snapGroupId: "b5551368-7881-4a23-a034-a0e757ec85a7",
        category: "beauty",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "4",
        name: "Monochrome",
        description: "Classic black and white filter with enhanced contrast for dramatic effect.",
        creator: "bwmaster",
        downloads: 6800,
        snapLensId: "monochrome-id",
        snapGroupId: "b5551368-7881-4a23-a034-a0e757ec85a7",
        category: "creative",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "5",
        name: "Vintage Film",
        description: "Recreate the warm, nostalgic look of vintage film photography.",
        creator: "vintagevibes",
        downloads: 11300,
        snapLensId: "vintage-film-id",
        snapGroupId: "b5551368-7881-4a23-a034-a0e757ec85a7",
        category: "portrait",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "6",
        name: "Aurora Glow",
        description: "Mystical aurora-inspired lighting effects that add magic to any scene.",
        creator: "mysticfx",
        downloads: 9700,
        snapLensId: "aurora-glow-id",
        snapGroupId: "b5551368-7881-4a23-a034-a0e757ec85a7",
        category: "creative",
        isActive: true,
        createdAt: new Date(),
      },
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
    const user: User = { ...insertUser, id };
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
      ...insertLens,
      id,
      description: insertLens.description ?? null,
      downloads: insertLens.downloads ?? null,
      snapGroupId: insertLens.snapGroupId ?? null,
      category: insertLens.category ?? null,
      isActive: insertLens.isActive ?? null,
      createdAt: new Date()
    };
    this.lenses.set(id, lens);
    return lens;
  }

  async getUserLenses(userId: string): Promise<(UserLens & { lens: Lens })[]> {
    const userLensesList = Array.from(this.userLenses.values()).filter(
      ul => ul.userId === userId
    );
    
    return userLensesList.map(ul => {
      const lens = this.lenses.get(ul.lensId);
      if (!lens) throw new Error(`Lens ${ul.lensId} not found`);
      return { ...ul, lens };
    });
  }

  async addUserLens(insertUserLens: InsertUserLens): Promise<UserLens> {
    const id = randomUUID();
    const userLens: UserLens = {
      ...insertUserLens,
      id,
      purchasedAt: new Date()
    };
    this.userLenses.set(id, userLens);
    return userLens;
  }
}

export const storage = new MemStorage();
