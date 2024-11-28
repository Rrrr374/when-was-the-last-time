// GLOBAL VARIABLES
let canvasWidth = 1200;
let canvasHeight = 849;
let scaleFactor;

let icons = [];
let backdrops = [];
let photos = [];
let highlights = [];
let hotspots = [];
let iconImages = [];

let currentBackdrop;
let stage = "landing";
let currentIcon = null;

let baseWidth = 2400; // Original canvas width
let baseHeight = 1698; // Original canvas height

function preload() {
  // Load backdrops
  backdrops.push(loadImage('assets/backdrop1.png'));
  backdrops.push(loadImage('assets/backdrop2.png'));
  backdrops.push(loadImage('assets/backdrop3.png'));

  // Load other assets
  for (let i = 1; i <= 15; i++) {
    photos.push(loadImage(`assets/photo${i}.PNG`));
    highlights.push(loadImage(`assets/highlight${i}.png`));
    hotspots.push(loadImage(`assets/hotspot${i}.PNG`));
    iconImages.push(loadImage(`assets/icon${i}.png`));
  }
}

function setup() {
  if (
    backdrops.length < 3 ||
    photos.length < 15 ||
    highlights.length < 15 ||
    hotspots.length < 15 ||
    iconImages.length < 15
  ) {
    console.error("Not all assets are loaded. Stopping execution.");
    noLoop();
    return;
  }

  // Initialize currentBackdrop to the first backdrop
  currentBackdrop = backdrops[0];

  scaleFactor = min(windowWidth / canvasWidth, windowHeight / canvasHeight);
  createCanvas(canvasWidth * scaleFactor, canvasHeight * scaleFactor);

  setupIcons();
}

function draw() {
  // Ensure scaleFactor is valid before scaling
  if (isNaN(scaleFactor) || scaleFactor <= 0) {
    console.error("Invalid scaleFactor. Skipping draw loop.");
    return;
  }

  scale(scaleFactor); // Scale everything proportionally

  // Render based on the current stage
  if (stage === "landing") {
    drawLandingPage();
  } else if (stage === "secondPage") {
    drawSecondPage();
  } else if (stage === "thirdPage") {
    drawThirdPage();
  }

  // Draw back button if not on the landing page
  if (stage !== "landing") {
    drawBackButton();
  }
}

// ICON SETUP
function setupIcons() {
  icons = []; // Reset icons array
  let centerX = width / 2;
  let centerY = height / 2;
  let radius = min(width, height) * 0.35;
  let sizes = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];

  for (let i = 0; i < 15; i++) {
    let angle = (TWO_PI / 15) * i;
    let x = centerX + radius * cos(angle);
    let y = centerY + radius * sin(angle);

    let section = floor(i / 5);
    icons.push({ x, y, size: sizes[i], section, id: i });
  }

  // Validate hotspot dimensions
  hotspots.forEach((hotspot, index) => {
    if (!hotspot || hotspot.width === undefined || hotspot.height === undefined) {
      console.error(`Hotspot ${index + 1} is undefined or not fully loaded.`);
    } else if (hotspot.width !== canvasWidth || hotspot.height !== canvasHeight) {
      console.warn(
        `Hotspot ${index + 1} dimensions (${hotspot.width}x${hotspot.height}) do not match canvas size (${canvasWidth}x${canvasHeight}).`
      );
    }
  });
}

// LANDING PAGE
function drawLandingPage() {
  if (!currentBackdrop) {
    console.error("Current backdrop is undefined. Skipping drawLandingPage.");
    return;
  }
  image(currentBackdrop, 0, 0, width, height);

  icons.forEach((icon, index) => {
    if (iconImages[index]) {
      image(iconImages[index], icon.x - icon.size / 2, icon.y - icon.size / 2, icon.size, icon.size);
    } else {
      console.error(`Icon image ${index} is undefined.`);
    }
  });

  updateLandingBackdrop();
}

function updateLandingBackdrop() {
  let hoveredSection = null;
  icons.forEach((icon) => {
    if (dist(mouseX / scaleFactor, mouseY / scaleFactor, icon.x, icon.y) < icon.size / 2) {
      hoveredSection = icon.section;
    }
  });
  if (hoveredSection !== null) {
    currentBackdrop = backdrops[hoveredSection];
  }
}

// PHOTO PAGE
function drawSecondPage() {
  // Display the photo as the background
  image(photos[currentIcon], 0, 0, width, height);

  // Remove any visualization of the hotspot, even in debug mode
  if (debugMode) {
    console.log("Debug Mode: Hotspot active but not rendered visually.");
  }
}

function drawThirdPage() {
  // Display the original photo as the background without blur
  image(photos[currentIcon], 0, 0, width, height);

  // Overlay the highlight image
  image(highlights[currentIcon], 0, 0, width, height);
}


// BACK BUTTON
function drawBackButton() {
  fill(200);
  rect(20, 20, 100, 40, 5);
  fill(0);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Back", 70, 40);
}

// MOUSE EVENTS
function mousePressed() {
  let scaledMouseX = mouseX / scaleFactor;
  let scaledMouseY = mouseY / scaleFactor;

  // Check if back button is clicked
  if (scaledMouseX > 20 && scaledMouseX < 140 && scaledMouseY > 20 && scaledMouseY < 70) {
    goBack();
    return;
  }

  // Handle other interactions
  if (stage === "landing") {
    icons.forEach((icon) => {
      if (dist(scaledMouseX, scaledMouseY, icon.x, icon.y) < icon.size / 2) {
        currentIcon = icon.id;
        stage = "secondPage";
      }
    });
  } else if (stage === "secondPage") {
    checkHotspotClick(scaledMouseX, scaledMouseY);
  }
}

// HOTSPOT CHECK
function checkHotspotClick(scaledMouseX, scaledMouseY) {
  if (!hotspots[currentIcon]) {
    console.error(`Hotspot for currentIcon ${currentIcon} is undefined. Skipping check.`);
    return;
  }

  // Dimensions of the hotspot image
  let hotspotWidth = hotspots[currentIcon].width;
  let hotspotHeight = hotspots[currentIcon].height;

  // Map the mouse coordinates from the canvas to the hotspot image
  let mappedX = (scaledMouseX / width) * hotspotWidth;
  let mappedY = (scaledMouseY / height) * hotspotHeight;

  // Load the pixel data of the hotspot
  hotspots[currentIcon].loadPixels();

  // Calculate the pixel index in the hotspot image
  let pixelIndex = (floor(mappedY) * hotspotWidth + floor(mappedX)) * 4;

  // Check if the pixelIndex is valid
  if (pixelIndex >= hotspots[currentIcon].pixels.length) {
    console.error(`Pixel index ${pixelIndex} is out of bounds for hotspot image.`);
    return;
  }

  // Get the alpha value at the clicked location
  let alphaValue = hotspots[currentIcon].pixels[pixelIndex + 3];

  console.log(`Alpha value at (${mappedX.toFixed(2)}, ${mappedY.toFixed(2)}): ${alphaValue}`);

  if (alphaValue > 0) {
    console.log("Hotspot clicked! Transitioning to the third page.");
    stage = "thirdPage";
  } else {
    console.log("Click was not on a hotspot.");
  }
}

// RESIZE HANDLER
function windowResized() {
  scaleFactor = min(windowWidth / canvasWidth, windowHeight / canvasHeight);
  resizeCanvas(canvasWidth * scaleFactor, canvasHeight * scaleFactor);
  setupIcons(); // Recalculate icons
}

// BACK NAVIGATION
function goBack() {
  if (stage === "thirdPage") {
    stage = "secondPage";
  } else if (stage === "secondPage") {
    stage = "landing";
  }
}
