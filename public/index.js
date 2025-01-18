const searchResultDiv = document.getElementById("searchResult");
const searchForm = document.getElementById("searchForm");
const loginForm = document.getElementById("loginForm");

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

searchForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const query = new URLSearchParams({
    name: document.getElementById("searchName").value,
    type: document.getElementById("searchType").value,
    rarity: document.getElementById("searchRarity").value,
    set: document.getElementById("searchSet").value,
  });
  const data = await readData(`cards?${query.toString()}`);
  console.log(data);
});

loginForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  login(username, password);
});
