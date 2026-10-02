require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// Common AI function
async function generateAI(prompt) {
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt
    });

    return response.text;
}


// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Task Manager AI Backend is running with Gemini!"
    });
});


// AI Suggest
app.post("/suggest", async (req, res) => {
    try {
        const { task } = req.body;

        if (!task) {
            return res.status(400).json({
                error: "Task is required"
            });
        }

        const result = await generateAI(
            `Improve this task and make it clear, specific and actionable. 
            Return only the improved task.
            
            Task: ${task}`
        );

        res.json({
            result: result
        });

    } catch (error) {
        console.error("Suggest Error:", error);

        res.status(500).json({
            error: "AI suggestion failed"
        });
    }
});


// AI Summarize
app.post("/summarize", async (req, res) => {
    try {
        const { task } = req.body;

        if (!task) {
            return res.status(400).json({
                error: "Task is required"
            });
        }

        const result = await generateAI(
            `Summarize this task briefly and clearly.
            Return only the summary.
            
            Task: ${task}`
        );

        res.json({
            result: result
        });

    } catch (error) {
        console.error("Summarize Error:", error);

        res.status(500).json({
            error: "AI summarization failed"
        });
    }
});


// AI Polish
app.post("/polish", async (req, res) => {
    try {
        const { task } = req.body;

        if (!task) {
            return res.status(400).json({
                error: "Task is required"
            });
        }

        const result = await generateAI(
            `Rewrite this task professionally and clearly.
            Return only the rewritten task.
            
            Task: ${task}`
        );

        res.json({
            result: result
        });

    } catch (error) {
        console.error("Polish Error:", error);

        res.status(500).json({
            error: "AI polishing failed"
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});