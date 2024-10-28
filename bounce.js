const cube = document.querySelector('.cube');
let posX = 0;
let posY = 0;
let speedX = 2;
let speedY = 2;
const maxWidth = window.innerWidth - 150;
const maxHeight = window.innerHeight - 150;

function bounceCube() {
  posX += speedX;
  posY += speedY;

  // Reverse direction if hitting an edge
  if (posX <= 0 || posX >= maxWidth) speedX *= -1;
  if (posY <= 0 || posY >= maxHeight) speedY *= -1;

  // Apply position and rotation
  cube.style.transform = `translate(${posX}px, ${posY}px) rotateY(${posX % 360}deg) rotateX(${posY % 360}deg)`;

  requestAnimationFrame(bounceCube);
}

bounceCube();
