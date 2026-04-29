# AGENTS.md

## Purpose

This document defines how agents (AI or human-assisted automation) should behave when interacting with this codebase.

The goal is to ensure consistency, maintainability, and safe modifications—especially when code is generated or modified automatically.

## Application Overview

This app is an AI-powered assistant that helps users automate their daily workflows. Users can:

- **Upload files** to provide context (documents, spreadsheets, notes, etc.) that the agent uses to understand their environment and tasks.
- **Chat via a UI** to instruct the agent, ask questions, and trigger automations based on the uploaded context.

The assistant combines RAG (Retrieval-Augmented Generation) with a conversational interface so that responses and actions are grounded in the user's own data.

## Code Guidelines

- Avoid comments that state the obvious, but use JSDoc when it adds meaningful context for IDE usage.
