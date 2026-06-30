# GoldTrack

A mobile application for scanning, analyzing, and managing gold bars using AI-powered vision recognition. Built with React Native and Expo.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Key Features & Usage](#key-features--usage)
- [Services](#services)
- [License](#license)

## ✨ Features

- **📸 AI-Powered Gold Bar Scanning**: Use your device camera to capture images of gold bars and automatically extract information using Google Gemini Vision AI
- **💾 Inventory Management**: Track and manage your gold bar inventory with detailed stock information
- **👥 Supplier Management**: Keep detailed records of your gold suppliers
- **📊 Data Export**: Export your inventory data to Excel/XLSX format for reporting and analysis
- **🔐 Secure Authentication**: User login and authentication system powered by Supabase
- **📱 Tab-Based Navigation**: Intuitive interface with dedicated tabs for scanning, inventory, and supplier management
- **🌙 Dark Mode UI**: Modern dark-themed interface for better visibility and reduced eye strain

## 🛠 Tech Stack

- **Frontend**: React Native 0.85.3, React 19.2.3
- **Framework**: Expo ~56.0.11, Expo Router ~56.2.10
- **Backend**: Supabase
- **AI/ML**: Google Genai (Gemini Vision)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Async Storage, Expo File System
- **Export**: XLSX library
- **Camera**: Expo Camera
- **Language**: TypeScript 6.0.3

## 📋 Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager
- Expo CLI (`npm install -g expo-cli`)
- A physical device or emulator (Android/iOS)
- A Supabase account and project
- Google Genai API key

## 🚀 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd metsan-packet-serial-number
```

2. **Install dependencies**
```bash
npm install
```

3. **Install Expo CLI (if not already installed)**
```bash
npm install -g expo-cli
```

## ⚙️ Configuration

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create the necessary database tables for storing gold bar information, inventory, and suppliers
3. Update your Supabase credentials in `src/services/supabase.ts`

### Google Genai API

1. Set up a Google Cloud project and enable the Gemini API
2. Generate an API key from the Google Cloud Console
3. Add your API key to the configuration in `src/services/geminiVision.ts`

### Environment Variables

Create a `.env` file in the root directory (or configure in your build system):

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_GENAI_API_KEY=your_google_genai_api_key
```

## 📱 Running the App

### Start Development Server
```bash
npm start
```

### Run on iOS
```bash
npm run ios
```

### Run on Android
```bash
npm run android
```

### Run on Web
```bash
npm run web
```

## 📁 Project Structure

```
metsan-packet-serial-number/
├── app/                           # Expo Router app directory
│   ├── _layout.tsx               # Root layout
│   ├── login.tsx                 # Login screen
│   ├── confirm.tsx               # Confirmation screen for scanned data
│   └── (tabs)/                   # Tab-based navigation
│       ├── _layout.tsx           # Tab navigator
│       ├── index.tsx             # Home/dashboard tab
│       ├── scan.tsx              # Gold bar scanning interface
│       ├── stock.tsx             # Inventory management
│       └── suppliers.tsx         # Supplier management
├── src/
│   ├── constants/
│   │   └── theme.ts             # Color scheme and design tokens
│   ├── context/
│   │   └── AuthContext.tsx       # Authentication context and providers
│   ├── services/
│   │   ├── database.ts           # Database operations
│   │   ├── export.ts            # Excel export functionality
│   │   ├── geminiVision.ts      # Google Gemini AI integration
│   │   └── supabase.ts          # Supabase client setup
│   └── types/
│       └── index.ts             # TypeScript type definitions
├── assets/                        # App icons and images
├── app.json                       # Expo app configuration
├── package.json                   # Project dependencies
└── tsconfig.json                  # TypeScript configuration
```

## 🔑 Key Features & Usage

### Scanning Gold Bars
1. Navigate to the "Scan" tab
2. Point your camera at a gold bar
3. Take a photo - the app will automatically analyze it using AI
4. Review extracted information on the confirmation screen
5. Manually edit if needed and save to inventory

### Inventory Management
- View all scanned and stored gold bars
- Track quantity, weight, and other details
- Update information as needed

### Supplier Management
- Manage list of gold suppliers
- Track supplier details and history

### Data Export
- Export your entire inventory to Excel format
- Use for reporting, analysis, or backup

### Authentication
- Secure login system
- User account management via Supabase

## 🔧 Services

### `database.ts`
Handles all database operations for storing and retrieving gold bar information, inventory, and supplier data.

### `geminiVision.ts`
Integrates Google Gemini Vision AI to analyze images of gold bars and extract relevant information (serial numbers, weight, purity, etc.).

### `supabase.ts`
Supabase client configuration and initialization for database and authentication services.

### `export.ts`
Generates and exports inventory data to XLSX (Excel) format for reporting and analysis.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for gold inventory management**
