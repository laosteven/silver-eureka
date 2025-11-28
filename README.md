# Jeopardy

A self-hosted Jeopardy game built with SvelteKit and shadcn-svelte. Host interactive trivia games where friends can join by scanning a QR code!

## Features

- 🎮 **Host Controls**: Full control over game flow, question selection, and scoring
- 📱 **QR Code Join**: Players can easily join by scanning a QR code
- ⚡ **Real-time**: WebSocket-powered buzzer system with instant feedback and sound alerts
- 🏆 **Leaderboard**: Track scores and display rankings at the end
- ⚙️ **Customizable**: Configure questions, categories, and game settings via YAML or environment variables
- 🖼️ **Media Support**: Add images (imgur, etc.) and YouTube videos to questions
- 🔄 **Session Restore**: Players can restore their session if they refresh by using the same username
- 🐳 **Docker Ready**: Easy self-hosting with Docker Compose

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/laosteven/silver-eureka.git
   cd silver-eureka
   ```

2. (Optional) Customize your game:
   - Edit `config/game.yaml` for questions
   - Set `GAME_TITLE` in environment for custom title

3. Start the application:
   ```bash
   docker compose up -d
   ```

4. Open `http://localhost:3000` in your browser

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Create a `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env to set GAME_TITLE
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser

## How to Play

### For the Host

1. Go to the main page and click "Host a Game"
2. Share the QR code with players or give them the join URL
3. Wait for players to join, then click "Start Game"
4. Select questions from the board
5. Click "Reveal Answer" when ready to see the answer
6. Award or deduct points based on answers
7. Show the leaderboard when the game is over (you can go back to continue playing)

### For Players

1. Scan the QR code or navigate to the join URL
2. Enter a temporary username
3. Wait for the host to start the game
4. When a question appears, press the big red BUZZ button to answer first!
5. Check your score and rank throughout the game
6. If you refresh, enter the same username to restore your progress

## Configuration

The game can be customized by editing the `config/game.yaml` file:

```yaml
title: "My Trivia Night!"
countdown: 30

categories:
  - name: "Category Name"
    questions:
      - value: 100
        question: "Your question here"
        answer: "What is the answer?"
      - value: 200
        question: "Question with an image"
        answer: "Another answer"
        image: "https://i.imgur.com/example.jpg"
      - value: 300
        question: "Question with a video"
        answer: "Video answer"
        youtube: "https://www.youtube.com/watch?v=example"
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `title` | Game title displayed on screens | "Jeopardy!" |
| `countdown` | Seconds allowed to answer (future feature) | 30 |
| `categories` | Array of category objects | Default categories |

### Question Options

| Option | Description | Required |
|--------|-------------|----------|
| `value` | Point value (100, 200, etc.) | Yes |
| `question` | The question text | Yes |
| `answer` | The answer text | Yes |
| `image` | URL to an image (imgur, etc.) | No |
| `youtube` | YouTube video URL | No |

## Tech Stack

- **Frontend**: SvelteKit 2, shadcn-svelte, TailwindCSS
- **Backend**: Node.js, Socket.IO
- **Build**: Vite, adapter-node
- **Containerization**: Docker

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `CONFIG_PATH` | Path to game YAML config | /config/game.yaml |
| `GAME_TITLE` | Game title (overrides YAML) | "Jeopardy!" |

## License

MIT
