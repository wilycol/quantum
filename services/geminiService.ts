
import { GoogleGenAI } from "@google/genai";
import { GroundingSource, PortfolioAsset, FAQItem, AITradeHistory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface MarketInsightsResponse {
    text: string;
    sources: GroundingSource[];
}

export const fetchMarketInsights = async (prompt: string): Promise<MarketInsightsResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text;
        
        const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: GroundingSource[] = rawChunks
            .map(chunk => chunk.web)
            .filter((web): web is { uri: string; title: string } => !!web && !!web.uri)
            .reduce((acc: GroundingSource[], current) => {
                if (!acc.some(item => item.uri === current.uri)) {
                    acc.push(current);
                }
                return acc;
            }, []);

        return { text, sources };
    } catch (error) {
        console.error("Error fetching market insights:", error);
        throw new Error("Failed to get insights from Gemini API. Please check your API key and network connection.");
    }
};

export const getTradeAdvice = async (instrument: string, tradeType?: 'BUY' | 'SELL'): Promise<string> => {
    const actionText = tradeType ? `placing a ${tradeType} trade on` : `analyzing`;
    const recommendationText = tradeType ? `"Proceed with caution", "Strong signal", "Consider waiting for confirmation"` : `"Monitor for breakout", "Favorable for long positions", "Consider shorting on weakness"`;

    const prompt = `
        As a professional trading analyst AI, provide a concise risk assessment and potential outlook for ${actionText} ${instrument} right now.
        Consider technical indicators (like RSI, MACD, moving averages), current market sentiment, and potential short-term volatility.
        Format the response in markdown as:
        **Analysis:** Your brief analysis.
        **Risk Level:** Low/Medium/High
        **Recommendation:** e.g., ${recommendationText}
        Keep the entire response under 70 words.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching trade advice:", error);
        throw new Error("Failed to get advice from Gemini API.");
    }
};

export const getPortfolioAnalysis = async (portfolio: PortfolioAsset[]): Promise<string> => {
    const portfolioSummary = portfolio.map(p => `- ${p.name} (${p.symbol}): ${p.amount.toFixed(2)} units, valued at $${p.totalValue.toFixed(2)} (P/L: $${p.pl.toFixed(2)})`).join('\n');
    const totalValue = portfolio.reduce((acc, p) => acc + p.totalValue, 0);

    const prompt = `
        As a professional financial advisor AI, analyze the following investment portfolio. The total value is approximately $${totalValue.toFixed(2)}.

        Portfolio composition:
        ${portfolioSummary}

        Provide a concise analysis in markdown format covering these three areas:
        1.  **Rebalancing Suggestions:** Based on the current composition, suggest potential rebalancing actions to optimize for growth or reduce risk. Are there any over-concentrations?
        2.  **Performance Alerts:** Highlight any significant gains, losses, or potential risks in the portfolio that the user should be aware of.
        3.  **Financial Tips:** Offer one or two general financial tips relevant to this kind of portfolio (e.g., diversification, long-term holding, etc.).

        Keep the entire response clear, actionable, and under 150 words.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching portfolio analysis:", error);
        throw new Error("Failed to get analysis from Gemini API.");
    }
};

export const getComparisonAnalysis = async (simulatedPortfolio: PortfolioAsset[], realPortfolio: PortfolioAsset[]): Promise<string> => {
    const formatPortfolio = (portfolio: PortfolioAsset[], title: string) => {
        const totalValue = portfolio.reduce((acc, p) => acc + p.totalValue, 0);
        const summary = portfolio.map(p => `- ${p.name}: $${p.totalValue.toFixed(0)} (P/L: ${p.plPercent.toFixed(1)}%)`).join('\n');
        return `**${title} Portfolio (Total Value: $${totalValue.toFixed(0)})**\n${summary}`;
    };

    const simulatedSummary = formatPortfolio(simulatedPortfolio, 'Simulated');
    const realSummary = formatPortfolio(realPortfolio, 'Real');

    const prompt = `
        As a professional financial advisor AI, conduct a comparative analysis of these two investment portfolios.

        ${simulatedSummary}

        ${realSummary}

        Provide a concise analysis in markdown format covering these three points:
        1.  **Performance Difference:** Briefly compare the performance of the two portfolios. Which one is performing better and why? Highlight the key assets driving the difference.
        2.  **Potential Gains Analysis:** Based on the simulated portfolio's performance (which presumably followed more AI suggestions), estimate the potential gain or loss the "Real" portfolio has missed out on. For example: "If the Real portfolio had followed a similar strategy to the Simulated one, its P/L could have been approximately X% higher."
        3.  **Actionable Insight:** Based on this comparison, provide one key actionable insight for the user regarding their "Real" portfolio.

        Keep the entire response clear, actionable, and under 170 words.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching comparison analysis:", error);
        throw new Error("Failed to get comparison analysis from Gemini API.");
    }
};

export const getNewsAnalysis = async (title: string, summary: string): Promise<string> => {
    const prompt = `
        As a financial analyst AI, provide a brief, actionable analysis of the following news item.
        Focus on its potential market impact.

        **Title:** ${title}
        **Summary:** ${summary}

        Provide your analysis in a single paragraph, under 60 words. Explain *why* it might impact the market (e.g., investor sentiment, inflation, a specific sector).
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching news analysis:", error);
        throw new Error("Failed to get news analysis from Gemini API.");
    }
};

export const getSupportChatResponse = async (question: string, faqs: FAQItem[]): Promise<string> => {
    const faqContext = faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n');

    const prompt = `
        You are an AI support assistant for a trading platform called QuantumTrade.
        Answer the user's question based *only* on the information provided in the following FAQs.
        If the answer is not in the FAQs, politely state that you don't have the information and suggest they use the contact form.
        Keep your answer concise and helpful.

        **FAQs:**
        ${faqContext}

        **User's Question:**
        ${question}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching support response:", error);
        throw new Error("Failed to get response from AI support.");
    }
};

export const getWeeklyAnalysis = async (aiTrades: AITradeHistory[]): Promise<string> => {
    const tradeSummary = aiTrades.map(t => `- ${t.asset} ${t.type}: P/L $${t.pl.toFixed(2)}, Confidence ${t.confidence}%, Reason: ${t.reason}`).join('\n');
    const totalPL = aiTrades.reduce((acc, t) => acc + t.pl, 0);
    const successCount = aiTrades.filter(t => t.pl > 0).length;
    const successRate = aiTrades.length > 0 ? (successCount / aiTrades.length) * 100 : 0;

    const prompt = `
        As the QuantumTrader AI, conduct a self-assessment of your trading performance for the past week based on the following trades.

        **Trade History:**
        ${tradeSummary}

        **Overall Performance:**
        - Total P/L: $${totalPL.toFixed(2)}
        - Success Rate: ${successRate.toFixed(1)}%

        Provide a concise analysis in markdown format, focusing on the following points as a learning exercise for yourself:
        1.  **Performance Summary:** Briefly summarize the weekly performance. Was it successful? What were the key drivers?
        2.  **Pattern Identification:** Did you identify any patterns in your successful or unsuccessful trades? (e.g., "My bullish divergence signals on BTC were highly effective," or "I struggled with high-volatility stock trades.").
        3.  **Key Learning:** State one specific, actionable learning objective for the next week. (e.g., "I will lower my confidence threshold for ranging markets," or "I need to improve my exit strategy for Forex pairs.").

        Keep the entire response under 180 words, written from your perspective as an AI improving its own strategy.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching weekly analysis:", error);
        throw new Error("Failed to get weekly analysis from Gemini API.");
    }
};
