let pet;
let hunger = 100;
let cleanliness = 100;
let happiness = 100;
let energy = 100;
let health = 100;
let poops = [];
let mealsToday = 0;
let isSick = false;
let gameDay = 1;
let lastMealTime = 0;
let lastDayChange = 0;
let isSleeping = false;
let currentMood = "normal";
let weather = "sunny";
let lastSaveTime = 0;

class SelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SelectionScene' });
  }

  preload() {
    this.load.image("dog", "assets/dog.png");
    this.load.image("cat", "assets/cat.png");
    this.load.image("rabbit", "assets/rabbit.png");
    this.load.image("button", "assets/button.png");
  }

  create() {
    this.add.text(400, 100, "Choisissez votre animal", { 
      fontSize: "32px", 
      fill: "#000" 
    }).setOrigin(0.5);

    const pets = [
      { type: "dog", label: "Chien", x: 200 },
      { type: "cat", label: "Chat", x: 400 },
      { type: "rabbit", label: "Lapin", x: 600 }
    ];

    pets.forEach(pet => {
      const image = this.add.image(pet.x, 300, pet.type).setScale(0.3).setInteractive();
      this.add.text(pet.x, 400, pet.label, { 
        fontSize: "24px", 
        fill: "#000" 
      }).setOrigin(0.5);

      image.on('pointerdown', () => {
        this.scene.start('GameScene', { petType: pet.type });
      });

      image.on('pointerover', () => {
        image.setScale(0.35);
      });

      image.on('pointerout', () => {
        image.setScale(0.3);
      });
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.petType = data.petType;
    this.lastHappinessDecrease = 0;
    this.lastDayChange = Date.now();
    this.isDead = false;
    this.loadGame(); // Charger la sauvegarde au démarrage
  }

  preload() {
    this.load.image("button", "assets/button.png");
    this.load.image("poop", "assets/poop.png");
    this.load.image("food", "assets/food.png");
    this.load.image(this.petType, `assets/${this.petType}.png`);
    this.load.image("sleep", "assets/sleep.png");
    this.load.image("cloud", "assets/cloud.png");
    this.load.image("rain", "assets/rain.png");
  }

  create() {
    // Création du fond avec météo
    this.createWeather();
    
    pet = this.add.image(400, 300, this.petType).setScale(0.3);
    this.createProgressBars();
    this.createMoodBubble();

    // Ajout du texte pour le jour et l'heure
    this.dayText = this.add.text(20, 120, `Jour ${gameDay}`, { 
      fontSize: "20px", 
      fill: "#000" 
    });

    this.timeText = this.add.text(20, 150, "00:00", {
      fontSize: "20px",
      fill: "#000"
    });

    const actions = [
      { label: "Jouer", x: 100, action: () => { 
        if (!isSick && !this.isDead && !isSleeping) {
          happiness = Math.min(happiness + 1, 100); 
          energy = Math.max(energy - 5, 0); 
          this.showMoodBubble("happy");
        }
      }},
      { label: "Balade", x: 220, action: () => { 
        if (!isSick && !this.isDead && !isSleeping) {
          happiness = Math.min(happiness + 10, 100); 
          hunger = Math.min(hunger + 5, 100); 
          energy = Math.max(energy - 10, 0); 
          spawnPoop(this);
          this.showMoodBubble("excited");
        }
      }},
      { label: "Nourrir", x: 340, action: () => { 
        if (!isSick && !this.isDead && !isSleeping) {
          this.feedPet();
        }
      }},
      { label: "Laver", x: 460, action: () => { 
        if (!isSick && !this.isDead && !isSleeping) {
          cleanliness = 100; 
          this.showMoodBubble("clean");
        }
      }},
      { label: "Ramasser", x: 580, action: () => { 
        if (!isSick && !this.isDead && !isSleeping) {
          cleanupPoops(); 
          cleanliness = Math.min(cleanliness + 10, 100); 
        }
      }}
    ];

    actions.forEach((btn) => {
      const b = this.add.image(btn.x, 530, "button").setInteractive().setScale(0.5);
      this.add.text(btn.x - 30, 510, btn.label, { fontSize: "14px", fill: "#000" });
      b.on("pointerdown", btn.action);
    });

    // Timers
    this.setupTimers();
  }

  createWeather() {
    this.weatherGroup = this.add.group();
    this.changeWeather();
  }

  changeWeather() {
    this.weatherGroup.clear(true, true);
    const weathers = ["sunny", "cloudy", "rainy"];
    this.weather = weathers[Math.floor(Math.random() * weathers.length)];
    
    if (this.weather === "cloudy") {
      for (let i = 0; i < 3; i++) {
        const cloud = this.add.image(
          Phaser.Math.Between(100, 700),
          Phaser.Math.Between(50, 150),
          "cloud"
        ).setScale(0.2);
        this.weatherGroup.add(cloud);
      }
    } else if (this.weather === "rainy") {
      for (let i = 0; i < 20; i++) {
        const rain = this.add.image(
          Phaser.Math.Between(0, 800),
          Phaser.Math.Between(0, 600),
          "rain"
        ).setScale(0.1);
        this.weatherGroup.add(rain);
      }
    }
  }

  createMoodBubble() {
    this.moodBubble = this.add.text(400, 200, "", {
      fontSize: "24px",
      fill: "#000",
      backgroundColor: "#ffffff",
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setVisible(false);
  }

  showMoodBubble(mood) {
    const moods = {
      happy: "😊",
      excited: "🎉",
      clean: "✨",
      sick: "🤒",
      tired: "😴",
      sad: "😢"
    };

    this.moodBubble.setText(moods[mood] || "😐");
    this.moodBubble.setVisible(true);
    this.time.delayedCall(2000, () => this.moodBubble.setVisible(false));
  }

  setupTimers() {
    // Timer pour les crottes
    this.time.addEvent({
      delay: 900000, // 15 minutes
      callback: () => spawnPoop(this),
      loop: true
    });

    // Timer pour la diminution du bonheur
    this.time.addEvent({
      delay: 60000, // 1 minute
      callback: () => {
        happiness = Math.max(happiness - 5, 0);
      },
      loop: true
    });

    // Timer pour le changement de jour
    this.time.addEvent({
      delay: 3600000, // 1 heure
      callback: () => this.advanceDay(),
      loop: true
    });

    // Timer pour la sauvegarde automatique
    this.time.addEvent({
      delay: 300000, // 5 minutes
      callback: () => this.saveGame(),
      loop: true
    });

    // Timer pour le changement de météo
    this.time.addEvent({
      delay: 1800000, // 30 minutes
      callback: () => this.changeWeather(),
      loop: true
    });
  }

  saveGame() {
    const gameState = {
      petType: this.petType,
      hunger,
      cleanliness,
      happiness,
      energy,
      health,
      mealsToday,
      isSick,
      gameDay,
      lastMealTime,
      lastDayChange,
      isSleeping,
      currentMood,
      weather
    };
    localStorage.setItem('petGameSave', JSON.stringify(gameState));
  }

  loadGame() {
    const savedGame = localStorage.getItem('petGameSave');
    if (savedGame) {
      const gameState = JSON.parse(savedGame);
      Object.assign(this, gameState);
    }
  }

  autoSleep() {
    if (energy < 20 && !isSleeping) {
      isSleeping = true;
      this.showMoodBubble("tired");
      const sleepIcon = this.add.image(400, 300, "sleep").setScale(0.2);
      
      this.time.delayedCall(300000, () => { // 5 minutes
        isSleeping = false;
        energy = Math.min(energy + 50, 100);
        sleepIcon.destroy();
      });
    }
  }

  feedPet() {
    const currentTime = Date.now();
    // Vérifier si c'est un nouveau jour
    if (currentTime - this.lastDayChange >= 3600000) {
      mealsToday = 0;
      this.lastDayChange = currentTime;
    }

    mealsToday++;
    hunger = Math.max(hunger - 20, 0);
    energy = Math.min(energy + 5, 100);

    // Animation de nourriture
    const food = this.add.image(400, 250, "food").setScale(0.1);
    this.tweens.add({
      targets: food,
      y: 350,
      duration: 1000,
      onComplete: () => food.destroy()
    });

    this.checkFeeding();
  }

  checkFeeding() {
    if (mealsToday > 2) {
      // Suralimentation
      this.getSick();
    } else if (mealsToday < 2 && Date.now() - this.lastDayChange >= 3600000) {
      // Sous-alimentation
      happiness = Math.max(happiness - 20, 0);
      energy = Math.max(energy - 15, 0);
    }
  }

  getSick() {
    isSick = true;
    health = Math.max(health - 30, 0);
    energy = Math.max(energy - 20, 0);
    happiness = Math.max(happiness - 15, 0);
    
    // Récupération automatique après 30 minutes
    this.time.delayedCall(1800000, () => this.recover());
  }

  recover() {
    isSick = false;
    health = Math.min(health + 50, 100);
  }

  advanceDay() {
    gameDay++;
    this.dayText.setText(`Jour ${gameDay}`);
    mealsToday = 0;
    this.lastDayChange = Date.now();
    
    // Vérifier l'état général
    this.checkMood();
  }

  checkMood() {
    if (hunger > 80) {
      happiness = Math.max(happiness - 10, 0);
    }
    if (cleanliness < 30) {
      happiness = Math.max(happiness - 15, 0);
    }
    if (energy < 20) {
      health = Math.max(health - 5, 0);
    }
  }

  createProgressBars() {
    const barWidth = 200;
    const barHeight = 20;
    const spacing = 30;
    const startX = 20;
    const startY = 20;

    const colors = {
      hunger: 0xff0000,    // Rouge
      cleanliness: 0x00ff00, // Vert
      happiness: 0xffff00,  // Jaune
      energy: 0x0000ff,    // Bleu
      health: 0xff00ff     // Magenta
    };

    this.barBackgrounds = {};
    this.barProgress = {};
    this.barText = {};

    Object.keys(colors).forEach((stat, index) => {
      const y = startY + (index * spacing);
      
      this.barBackgrounds[stat] = this.add.rectangle(
        startX + barWidth/2,
        y + barHeight/2,
        barWidth,
        barHeight,
        0xcccccc
      );

      this.barProgress[stat] = this.add.rectangle(
        startX,
        y + barHeight/2,
        0,
        barHeight,
        colors[stat]
      );
      this.barProgress[stat].setOrigin(0, 0.5);

      this.barText[stat] = this.add.text(
        startX + barWidth + 10,
        y,
        stat.charAt(0).toUpperCase() + stat.slice(1) + ": 100%",
        { fontSize: "16px", fill: "#000" }
      );
    });
  }

  checkDeath() {
    if (hunger <= 0 || cleanliness <= 0 || happiness <= 0 || energy <= 0 || health <= 0) {
      this.isDead = true;
      this.handleDeath();
      return true;
    }
    return false;
  }

  handleDeath() {
    // Animation de disparition
    this.tweens.add({
      targets: pet,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        pet.destroy();
        this.showGameOver();
      }
    });

    // Désactiver tous les timers
    this.time.removeAllEvents();
  }

  showGameOver() {
    // Créer un fond semi-transparent
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
    
    // Texte Game Over
    const gameOverText = this.add.text(400, 200, "GAME OVER", {
      fontSize: "64px",
      fill: "#ff0000",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Texte explicatif
    const reasonText = this.add.text(400, 300, "Votre animal est mort de :", {
      fontSize: "32px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    // Déterminer la cause de la mort
    let deathReason = "";
    if (hunger <= 0) deathReason = "Faim";
    else if (cleanliness <= 0) deathReason = "Manque d'hygiène";
    else if (happiness <= 0) deathReason = "Tristesse";
    else if (energy <= 0) deathReason = "Épuisement";
    else if (health <= 0) deathReason = "Maladie";

    const causeText = this.add.text(400, 350, deathReason, {
      fontSize: "48px",
      fill: "#ff0000",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Bouton pour recommencer
    const restartButton = this.add.rectangle(400, 450, 200, 50, 0x00ff00)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('SelectionScene');
      });

    this.add.text(400, 450, "Recommencer", {
      fontSize: "24px",
      fill: "#000000"
    }).setOrigin(0.5);
  }

  update(time) {
    if (this.isDead) return;

    // Mise à jour de l'heure
    const gameTime = new Date(time - this.lastDayChange);
    this.timeText.setText(
      `${String(gameTime.getHours()).padStart(2, '0')}:${String(gameTime.getMinutes()).padStart(2, '0')}`
    );

    // Mise à jour des statistiques
    hunger = Math.min(hunger + 0.01, 100);
    cleanliness = Math.max(cleanliness - (poops.length * 0.02), 0);
    happiness = Math.max(happiness - (poops.length * 0.01), 0);
    energy = Math.max(energy - 0.005, 0);

    if (isSick) {
      health = Math.max(health - 0.01, 0);
    }

    // Vérification de la mort
    if (this.checkDeath()) {
      return;
    }

    // Vérification du sommeil automatique
    this.autoSleep();

    // Mise à jour des barres de progression
    const stats = { hunger, cleanliness, happiness, energy, health };
    Object.keys(stats).forEach(stat => {
      const value = Math.floor(stats[stat]);
      const barWidth = (value / 100) * 200;
      
      this.barProgress[stat].width = barWidth;
      
      this.barText[stat].setText(
        stat.charAt(0).toUpperCase() + stat.slice(1) + ": " + value + "%"
      );
    });

    // Sauvegarde automatique toutes les 5 minutes
    if (time - lastSaveTime > 300000) {
      this.saveGame();
      lastSaveTime = time;
    }
  }
}

function spawnPoop(scene) {
  const x = Phaser.Math.Between(100, 700);
  const y = Phaser.Math.Between(150, 450);
  const poop = scene.add.image(x, y, "poop").setScale(0.05);
  poops.push(poop);
}

function cleanupPoops() {
  poops.forEach(p => p.destroy());
  poops = [];
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#d0f4f7",
  scene: [SelectionScene, GameScene],
  parent: 'game'
};

const game = new Phaser.Game(config);
