const searchResultDiv = document.getElementById("searchResult");
const searchForm = document.getElementById("searchForm");
const loginForm = document.getElementById("loginForm");
const createResultDiv = document.getElementById("createResult");
const createForm = document.getElementById("createForm");

const login = async (username, password) => {
  const resp = await fetch(`http://localhost:3000/getToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!resp.ok) {
    throw Error("There was a problem in the login request");
  }
  if (resp.status === 401) {
    throw "Invalid credentials";
  } else if (resp.status === 400) {
    throw "Invalid email or password format";
  }
  const data = await resp.json();
  // Save your token in session storage
  sessionStorage.setItem("jwt-token", data.token);
  const elements = document.getElementsByClassName(".hiddenUntilAuth");
  for (const element of elements) {
    element.style.display = "block";
  }
};

const readData = async (path) => {
  const resp = await fetch(`http://localhost:3000/${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    if (resp.status === 403) {
      throw Error("There was a problem in the login request");
    } else {
      throw Error("Unknown error");
    }
  }

  const data = await resp.json();
  return data;
};

const readProtectedData = async (path) => {
  const token = sessionStorage.getItem("jwt-token");

  const resp = await fetch(`http://localhost:3000/${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  });

  if (!resp.ok) {
    if (resp.status === 403) {
      throw Error("There was a problem in the login request");
    } else {
      throw Error("Unknown error");
    }
  }

  const data = await resp.json();
  return data;
};

const postProtectedData = async (path, data) => {
  const token = sessionStorage.getItem("jwt-token");

  const resp = await fetch(`http://localhost:3000/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(data),
  });

  if (!resp.ok) {
    if (resp.status === 403) {
      throw Error("There was a problem in the login request");
    } else {
      throw Error("Unknown error");
    }
  }

  return await resp.json();
};

searchForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();

  const query = new URLSearchParams({
    name: document.getElementById("searchName").value,
    type: document.getElementById("searchType").value,
    rarity: document.getElementById("searchRarity").value,
    set: document.getElementById("searchSet").value,
    power: document.getElementById("searchPower").value,
    toughness: document.getElementById("searchToughness").value,
  });
  const cards = await readData(`cards?${query.toString()}`);
  searchResultDiv.innerHTML = "";
  cards.forEach((card) => {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");

    // Add card details
    cardElement.innerHTML = `
      <h3>${card.name}</h3>
      <p><strong>Set:</strong> ${card.set}</p>
      <p><strong>Card Number:</strong> ${card.cardNumber}</p>
      <p><strong>Type:</strong> ${card.type}</p>
      <p><strong>Power:</strong> ${card.power}</p>
      <p><strong>Toughness:</strong> ${card.toughness}</p>
      <p><strong>Rarity:</strong> ${card.rarity}</p>
      <p><strong>Cost:</strong> ${card.cost}</p>
      <p>id: ${card.id}</p>
    `;

    // Append the card element to the grid
    searchResultDiv.appendChild(cardElement);
  });
});

loginForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  login(username, password);
});

createForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();

  const newCard = {
    name: document.getElementById("createName").value,
    type: document.getElementById("createType").value,
    rarity: document.getElementById("createRarity").value,
    set: document.getElementById("createSet").value,
    power: document.getElementById("createPower").value,
    toughness: document.getElementById("createToughness").value,
    cost: document.getElementById("createCost").value,
  };

  const card = await postProtectedData("cards/create", newCard);

  createResultDiv.innerHTML = `
      <h3>${card.name}</h3>
      <p><strong>Set:</strong> ${card.set}</p>
      <p><strong>Card Number:</strong> ${card.cardNumber}</p>
      <p><strong>Type:</strong> ${card.type}</p>
      <p><strong>Power:</strong> ${card.power}</p>
      <p><strong>Toughness:</strong> ${card.toughness}</p>
      <p><strong>Rarity:</strong> ${card.rarity}</p>
      <p><strong>Cost:</strong> ${card.cost}</p>
      <p>id: ${card.id}</p>
    `;
});
