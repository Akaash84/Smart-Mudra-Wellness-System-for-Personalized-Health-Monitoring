"use client";

import { useState } from "react";
import { assistantReply } from "../../lib/mudra";

type Message = {
  role: "user" | "bot";
  text: string;
  mudra?: string;
  benefits?: string[];
};

const starterMessages: Message[] = [
  { role: "bot", text: "Tell me how you feel, and I will suggest a mudra practice." },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState("");

  function sendMessage(text: string) {
    if (!text.trim()) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", text },
      {
        role: "bot",
        text: assistantReply(text).response,
        mudra: assistantReply(text).mudra,
        benefits: assistantReply(text).benefits,
      },
    ]);
    setInput("");
  }

  return (
    <div className="chat-layout">
      <section className="chat-window">
        <div>
          <h1 className="section-title">Mudra Assistant</h1>
          <p className="section-subtitle">A WhatsApp-style wellness chatbot for quick guidance.</p>
        </div>

        <div className="chat-card chat-thread">
          {messages.map((message, index) => (
            <div className={`bubble ${message.role}`} key={`${message.role}-${index}`}>
              <p>{message.text}</p>
              {message.mudra && <p className="meta"><strong>Suggested:</strong> {message.mudra}</p>}
              {message.benefits && (
                <div className="tag-row">
                  {message.benefits.map((benefit) => (
                    <span className="tag" key={benefit}>{benefit}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hero-actions">
          <input
            className="field input"
            style={{ flex: 1, minWidth: 260 }}
            placeholder="I feel stressed..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <button className="button" onClick={() => sendMessage(input)}>Send</button>
        </div>
      </section>

      <aside className="card">
        <h2 className="section-title">Quick Prompts</h2>
        <div className="tag-row">
          {[
            "I feel stressed",
            "I need focus",
            "I have low energy",
            "How do I do Gyan Mudra?",
          ].map((prompt) => (
            <button key={prompt} type="button" className="tag" onClick={() => sendMessage(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
