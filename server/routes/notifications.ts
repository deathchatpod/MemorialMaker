import { Router } from "express";
import { storage } from "../storage";
import { NotificationService } from "../services/notifications";

const router = Router();

// Send evaluation reminder email
router.post("/send-evaluation-reminder", async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ message: "Email and name are required" });
    }

    const success = await NotificationService.sendEvaluationReminder(email, name);
    
    if (success) {
      res.json({ message: "Evaluation reminder sent successfully" });
    } else {
      res.status(500).json({ message: "Failed to send evaluation reminder" });
    }
  } catch (error) {
    console.error("Error sending evaluation reminder:", error);
    res.status(500).json({ message: "Failed to send evaluation reminder" });
  }
});

// Send weekly digest to funeral home
router.post("/send-weekly-digest/:funeralHomeId", async (req, res) => {
  try {
    const funeralHomeId = parseInt(req.params.funeralHomeId);
    
    if (isNaN(funeralHomeId)) {
      return res.status(400).json({ message: "Invalid funeral home ID" });
    }

    const success = await NotificationService.sendWeeklyDigest(funeralHomeId);
    
    if (success) {
      res.json({ message: "Weekly digest sent successfully" });
    } else {
      res.status(500).json({ message: "Failed to send weekly digest" });
    }
  } catch (error) {
    console.error("Error sending weekly digest:", error);
    res.status(500).json({ message: "Failed to send weekly digest" });
  }
});

// Test email configuration
router.post("/test-email", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const success = await NotificationService.sendEvaluationReminder(
      email,
      "Test User"
    );
    
    if (success) {
      res.json({ message: "Test email sent successfully" });
    } else {
      res.status(500).json({ message: "Failed to send test email" });
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({ message: "Email service not configured or failed" });
  }
});

// Get notification statistics
router.get("/stats/:funeralHomeId", async (req, res) => {
  try {
    const funeralHomeId = parseInt(req.params.funeralHomeId);
    
    if (isNaN(funeralHomeId)) {
      return res.status(400).json({ message: "Invalid funeral home ID" });
    }

    const obituaries = await storage.getObituariesByFuneralHome(funeralHomeId);
    const finalSpaces = await storage.getFinalSpacesByFuneralHome(funeralHomeId);
    
    const recentObituaries = obituaries.filter(obit => 
      new Date(obit.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    const recentMemorials = finalSpaces.filter(space => 
      new Date(space.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    const stats = {
      totalObituaries: obituaries.length,
      totalMemorials: finalSpaces.length,
      recentObituaries: recentObituaries.length,
      recentMemorials: recentMemorials.length,
      weeklyActivity: recentObituaries.length + recentMemorials.length
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    res.status(500).json({ message: "Failed to fetch notification stats" });
  }
});

export default router;