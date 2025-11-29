# Trivia & Chill

A self-hosted Jeopardy game built with SvelteKit and shadcn-svelte. Host interactive trivia games where friends can join by scanning a QR code!

## Screenshots

![Gameboard](https://imgur.com/MmIZtxh.png)

![Question](https://imgur.com/vkMhdQq.png)

## Quick Start

### Using Docker Compose (Recommended)

1. Get the `.env` file

   ```bash
   wget -O .env https://raw.githubusercontent.com/laosteven/trivia-n-chill/refs/heads/master/.env.example
   ```

2. Get the `game.yml` file

   ```bash
   wget -O game.yml https://raw.githubusercontent.com/laosteven/trivia-n-chill/refs/heads/master/config/game.yml
   ```

3. Get the docker compose file

   ```bash
   wget -O docker-compose.yml https://raw.githubusercontent.com/laosteven/trivia-n-chill/refs/heads/master/docker-compose.prod.yml
   ```

4. Start the container:

   ```bash
   docker compose up -d
   ```

5. Open `http://localhost:3000` in your browser

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

## Features

- 🎮 **Host controls**: Full control over game flow, question selection, and scoring
- 📱 **QR code join**: Players can easily join by scanning a QR code
- ⚡ **Real-time**: WebSocket-powered buzzer system with instant feedback and sound alerts
- 🏆 **Leaderboard**: Track scores and display rankings at the end
- ⚙️ **Customizable**: Configure questions, categories, and game settings via YAML or environment variables
- 🖼️ **Media support**: Add images (imgur, etc.) and YouTube videos to questions
- 🔄 **Session restore**: Players can restore their session if they refresh by using the same username
- 🐳 **Docker ready**: Easy self-hosting with Docker Compose

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

The game can be customized by editing the `config/game.yml` file:

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

| Option       | Description                                | Default            |
| ------------ | ------------------------------------------ | ------------------ |
| `title`      | Game title displayed on screens            | "Trivia & Chill"   |
| `countdown`  | Seconds allowed to answer (future feature) | 30                 |
| `categories` | Array of category objects                  | Default categories |

### Question Options

| Option     | Description                   | Required |
| ---------- | ----------------------------- | -------- |
| `value`    | Point value (100, 200, etc.)  | Yes      |
| `question` | The question text             | Yes      |
| `answer`   | The answer text               | Yes      |
| `image`    | URL to an image (imgur, etc.) | No       |
| `youtube`  | YouTube video URL             | No       |

## Tech Stack

- **Frontend**: SvelteKit 2, shadcn-svelte, TailwindCSS
- **Backend**: Node.js, Socket.IO
- **Build**: Vite, adapter-node
- **Containerization**: Docker

## Environment Variables

| Variable      | Description              | Default           |
| ------------- | ------------------------ | ----------------- |
| `PORT`        | Server port              | 3000              |
| `CONFIG_PATH` | Path to game YAML config | /config/game.yml |
| `GAME_TITLE`  | Game title               | "Trivia & Chill"  |

## More screenshots

### Landing page

![Landing](https://imgur.com/8feG4Ge.png)

### Lobby & join

![Lobby](https://imgur.com/hVTWca2.png)

### Player view

![Landing](https://imgur.com/HPxhydK.png)

![Stand by](https://imgur.com/yT45TU2.png)

![Rename modal](https://imgur.com/XpG2qRL.png)

![Buzzer](https://imgur.com/XjIsWC0.png)

![Buzzed](https://imgur.com/SIizWcM.png)

### Player management

![Management](https://imgur.com/JQN4lSq.png)

### Leaderboard

![Leaderboard](https://imgur.com/Zlf8Kd3.png)

## License

MIT
