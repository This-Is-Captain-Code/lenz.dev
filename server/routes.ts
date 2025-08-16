import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLensSchema, insertUserLensSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all lenses
  app.get("/api/lenses", async (req, res) => {
    try {
      const lenses = await storage.getLenses();
      res.json(lenses);
    } catch (error) {
      console.error("Error fetching lenses:", error);
      res.status(500).json({ message: "Failed to fetch lenses" });
    }
  });

  // Get specific lens
  app.get("/api/lenses/:id", async (req, res) => {
    try {
      const lens = await storage.getLens(req.params.id);
      if (!lens) {
        return res.status(404).json({ message: "Lens not found" });
      }
      res.json(lens);
    } catch (error) {
      console.error("Error fetching lens:", error);
      res.status(500).json({ message: "Failed to fetch lens" });
    }
  });

  // Create new lens
  app.post("/api/lenses", async (req, res) => {
    try {
      const validatedData = insertLensSchema.parse(req.body);
      const lens = await storage.createLens(validatedData);
      res.status(201).json(lens);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lens data", errors: error.errors });
      }
      console.error("Error creating lens:", error);
      res.status(500).json({ message: "Failed to create lens" });
    }
  });

  // Get user's purchased lenses
  app.get("/api/my-lenses", async (req, res) => {
    try {
      // For now, return empty array since we don't have authentication
      // In a real app, you'd get the userId from the session
      res.json([]);
    } catch (error) {
      console.error("Error fetching user lenses:", error);
      res.status(500).json({ message: "Failed to fetch user lenses" });
    }
  });

  // Purchase/add lens to user's collection
  app.post("/api/my-lenses", async (req, res) => {
    try {
      const validatedData = insertUserLensSchema.parse(req.body);
      const userLens = await storage.addUserLens(validatedData);
      res.status(201).json(userLens);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding user lens:", error);
      res.status(500).json({ message: "Failed to add lens to collection" });
    }
  });

  // Get current user (mock endpoint)
  app.get("/api/user", async (req, res) => {
    try {
      // Return null for guest user
      res.json(null);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Mock logout endpoint
  app.post("/api/logout", async (req, res) => {
    try {
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ message: "Failed to log out" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
