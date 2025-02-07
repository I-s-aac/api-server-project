const searchResultDiv = document.getElementById("searchResult");
const searchForm = document.getElementById("searchForm");
const loginForm = document.getElementById("loginForm");
const modifyResultDiv = document.getElementById("modifyResult");
const modifySubmit = document.getElementById("modifySubmit");
const modifySelect = document.getElementById("modifySelect");

const login = async (username, password) => {
  const resp = await fetch(`http://localhost:3000/getToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (resp.status === 401) {
    throw "Invalid credentials";
  } else if (resp.status === 400) {
    throw "Invalid email or password format";
  }

  if (!resp.ok) {
    throw Error("There was a problem in the login request");
  }
  const data = await resp.json();
  // Save your token in session storage
  sessionStorage.setItem("jwt-token", data.token);
  const elements = document.getElementsByClassName("hiddenUntilAuth");
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
      throw Error("There was a problem in the request");
    } else if (resp.status === 400) {
      const message = `problem(s) with request: ${await resp.json()}`;
      console.error(message);
      return message;
      // throw Error(message);
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

  if (cards) {
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
  } else {
    searchResultDiv.innerText = "there are no cards";
  }
});

const showCardsX = async (x) => {
  const query = new URLSearchParams({
    returnSpecial: x,
  });
  const data = await readData(`cards?${query.toString()}`);
  searchResultDiv.innerHTML = "";

  if (!data) {
    searchResultDiv.innerText = "there are no cards";
    return;
  }

  if (x !== "random") {
    searchResultDiv.innerHTML = "<ul>";
    for (const point of data) {
      searchResultDiv.innerHTML += `
      <li>${point}</li>
    `;
    }
    searchResultDiv.innerHTML += "</ul>";
  } else {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <h3>${data[0].name}</h3>
      <p><strong>Set:</strong> ${data[0].set}</p>
      <p><strong>Card Number:</strong> ${data[0].cardNumber}</p>
      <p><strong>Type:</strong> ${data[0].type}</p>
      <p><strong>Power:</strong> ${data[0].power}</p>
      <p><strong>Toughness:</strong> ${data[0].toughness}</p>
      <p><strong>Rarity:</strong> ${data[0].rarity}</p>
      <p><strong>Cost:</strong> ${data[0].cost}</p>
      <p>id: ${data[0].id}</p>
    `;
    searchResultDiv.appendChild(card);
  }
};

document.getElementById("showCardSets").addEventListener("click", (ev) => {
  showCardsX("sets");
});
document.getElementById("showCardCount").addEventListener("click", (ev) => {
  showCardsX("count");
});
document.getElementById("showCardTypes").addEventListener("click", (ev) => {
  showCardsX("types");
});
document.getElementById("showCardRarities").addEventListener("click", (ev) => {
  showCardsX("rarities");
});
document.getElementById("showRandomCard").addEventListener("click", (ev) => {
  showCardsX("random");
});

document
  .getElementById("showAllCards")
  .addEventListener("click", async (ev) => {
    const query = new URLSearchParams({
      returnSpecial: "all",
    });
    const cards = await readData(`cards?${query.toString()}`);
    searchResultDiv.innerHTML = "";
    if (cards) {
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
    } else {
      searchResultDiv.innerText = "there are no cards";
    }
  });

loginForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  login(username, password);
});

modifySubmit.addEventListener("click", async (ev) => {
  const action = modifySelect.value;

  const data = {
    id: document.getElementById("selectId").value,
    name: document.getElementById("modifyName").value,
    type: document.getElementById("modifyType").value,
    rarity: document.getElementById("modifyRarity").value,
    set: document.getElementById("modifySet").value,
    power: document.getElementById("modifyPower").value,
    toughness: document.getElementById("modifyToughness").value,
    cost: document.getElementById("modifyCost").value,
  };

  const token = sessionStorage.getItem("jwt-token");
  if (!token) {
    alert("must be logged in to do this");
    return;
  }

  switch (action) {
    case "create": {
      const newCard = data;
      newCard.id = 0;

      const card = await postProtectedData("cards/create", newCard);
      console.log(card);

      modifyResultDiv.innerHTML =
        typeof card !== "string"
          ? `
      <h3>${card.name}</h3>
      <p><strong>Set:</strong> ${card.set}</p>
      <p><strong>Type:</strong> ${card.type}</p>
      <p><strong>Power:</strong> ${card.power}</p>
      <p><strong>Card Number:</strong> ${card.cardNumber}</p>
      <p><strong>Toughness:</strong> ${card.toughness}</p>
      <p><strong>Rarity:</strong> ${card.rarity}</p>
      <p><strong>Cost:</strong> ${card.cost}</p>
      <p>id: ${card.id}</p>
      `
          : `<p>${card}</p>`;
      break;
    }
    case "update": {
      const updateCard = async (id) => {
        if (!id) return "id is required";

        try {
          const resp = await fetch(`/cards/${id}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });

          if (!resp.ok) {
            if (resp.status === 403) throw new Error("Unauthorized request");
            if (resp.status === 400) {
              const message = `problem(s) with request: ${await resp.json()}`;
              return message;
            }
            throw new Error("Unknown error");
          }

          return await resp.json();
        } catch (error) {
          console.error("Error updating:", error);
          return "Error updating card.";
        }
      };

      const card = await updateCard(data.id);
      modifyResultDiv.innerHTML =
        typeof card !== "string"
          ? `
      <h3>${card.name}</h3>
      <p><strong>Set:</strong> ${card.set}</p>
      <p><strong>Type:</strong> ${card.type}</p>
      <p><strong>Power:</strong> ${card.power}</p>
      <p><strong>Card Number:</strong> ${card.cardNumber}</p>
      <p><strong>Toughness:</strong> ${card.toughness}</p>
      <p><strong>Rarity:</strong> ${card.rarity}</p>
      <p><strong>Cost:</strong> ${card.cost}</p>
      <p>id: ${card.id}</p>
      `
          : `<p>${card}</p>`;
      break;
    }
    case "delete": {
      const deleteCard = async (id) => {
        try {
          const resp = await fetch(`/cards/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!resp.ok) {
            if (resp.status === 403) {
              throw new Error("There was a problem in the request");
            } else if (resp.status === 400) {
              const message = `problem(s) with request: ${await resp.json()}`;
              console.error(message);
              return message;
            } else {
              throw new Error("Unknown error");
            }
          }

          return await resp.json(); // Ensure we return the response
        } catch (error) {
          console.error("Error deleting:", error);
          return "Error deleting card.";
        }
      };

      const removedCard = await deleteCard(data.id);
      modifyResultDiv.innerHTML =
        typeof removedCard !== "string"
          ? `
          <h2>removed card:</h2>
      <h3>${removedCard.name}</h3>
      <p><strong>Set:</strong> ${removedCard.set}</p>
      <p><strong>Type:</strong> ${removedCard.type}</p>
      <p><strong>Power:</strong> ${removedCard.power}</p>
      <p><strong>Card Number:</strong> ${removedCard.cardNumber}</p>
      <p><strong>Toughness:</strong> ${removedCard.toughness}</p>
      <p><strong>Rarity:</strong> ${removedCard.rarity}</p>
      <p><strong>Cost:</strong> ${removedCard.cost}</p>
      <p>id: ${removedCard.id}</p>
      `
          : `<p>${removedCard}</p>`;
      break;
    }
    default: {
      console.log("invalid option, did you mess with the html?");
      break;
    }
  }
});

modifySelect.addEventListener("change", (ev) => {
  const hide = (element) => {
    element.style.display = "none";
  };
  const show = (element) => {
    element.style.display = "inline";
  };
  const get = (id) => {
    return document.getElementById(id);
  };
  const id = get("selectIdLabel");
  const name = get("modifyNameLabel");
  const type = get("modifyTypeLabel");
  const rarity = get("modifyRarityLabel");
  const set = get("modifySetLabel");
  const toughness = get("modifyToughnessLabel");
  const power = get("modifyPowerLabel");
  const cost = get("modifyCostLabel");

  const showAll = () => {
    show(id);
    show(name);
    show(type);
    show(rarity);
    show(set);
    show(toughness);
    show(power);
    show(cost);
  };
  const hideAll = () => {
    hide(id);
    hide(name);
    hide(type);
    hide(rarity);
    hide(set);
    hide(toughness);
    hide(power);
    hide(cost);
  };

  // show or hide stuff depending on what's selected
  switch (modifySelect.value) {
    case "create": {
      modifySubmit.value = "create";
      showAll();
      hide(id);
      break;
    }
    case "update": {
      modifySubmit.value = "update";
      showAll();
      break;
    }
    case "delete": {
      modifySubmit.value = "delete";
      hideAll();
      show(id);
      break;
    }
    default: {
      console.log("invalid option, did you mess with the html?");
      break;
    }
  }
});
