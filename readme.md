# Uptrack

This is **Uptrack**, a fitness and nutrition tracking application.

## Repository Address

The complete repository for the application, including the source code, is available at:  
[https://github.com/IulianBirladeanu07/uptrack](https://github.com/IulianBirladeanu07/uptrack)

## Installation

To set up and run the application locally, follow these steps:

### Clone the Repository

```bash
git clone https://github.com/IulianBirladeanu07/uptrack.git
cd uptrack
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the root directory and add the required environment variables for Firebase, Supabase, and Google OAuth.

### Run the Application

```bash
npm start
```

## Project Structure

```
uptrack/
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/
├── src/
│   ├── __mocks__/
│   ├── __tests__/
│   ├── config/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   ├── services/
│   │   │   └── styles/
│   │   ├── dashboard/
│   │   │   ├── screens/
│   │   │   └── styles/
│   │   ├── nutrition/
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   ├── handlers/
│   │   │   ├── helpers/
│   │   │   ├── screens/
│   │   │   ├── services/
│   │   │   ├── styles/
│   │   │   └── utils/
│   │   ├── profile/
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   ├── helpers/
│   │   │   ├── screens/
│   │   │   ├── services/
│   │   │   ├── styles/
│   │   │   └── utils/
│   │   ├── progress/
│   │   │   ├── screens/
│   │   │   └── styles/
│   │   └── workout/
│   │       ├── components/
│   │       ├── context/
│   │       ├── handlers/
│   │       ├── hooks/
│   │       ├── screens/
│   │       ├── services/
│   │       ├── styles/
│   │       └── utils/
│   ├── navigation/
│   └── shared/
│       ├── components/
│       ├── constants/
│       ├── hooks/
│       ├── services/
│       ├── styles/
│       └── utils/
├── scripts/
├── .gitignore
├── App.js
├── app.config.js
├── babel.config.js
├── eas.json
├── metro.config.js
├── package.json
└── readme.md
```

## Features

### Authentication
- User registration and login
- Password reset functionality
- Secure authentication with Firebase

### Dashboard
- Overview of fitness and nutrition metrics
- Quick access to key features

### Nutrition Tracking
- Food logging with barcode scanning
- Macro and calorie tracking
- Weight monitoring
- Custom food database integration

### Workout Management
- Create and manage workout splits
- Exercise library
- Workout history tracking
- Custom exercise creation
- Real-time workout timer

### Profile & Settings
- User profile management
- Body measurements tracking
- App settings and preferences

### Progress Tracking
- Visual progress charts
- Historical data analysis
- Performance metrics

## Technologies Used

- **React Native** - Mobile application framework
- **Expo** - Development and build tooling
- **Firebase** - Authentication and storage
- **Supabase** - Database and backend services
- **React Navigation** - Navigation library

## License

This project is licensed under the MIT License. See the LICENSE file for details.