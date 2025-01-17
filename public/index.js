const button = document.getElementById("test");
const button2 = document.getElementById("test2");

const login = async (username, password) => {
  const resp = await fetch(`http://localhost:3000/getToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!resp.ok) throw Error("There was a problem in the login request");
  if (resp.status === 401) {
    throw "Invalid credentials";
  } else if (resp.status === 400) {
    throw "Invalid email or password format";
  }
  const data = await resp.json();
  // Save your token in session storage
  sessionStorage.setItem("jwt-token", data.token);

};

const test = async () => {
  const token = sessionStorage.getItem("jwt-token");

  const resp = await fetch(`http://localhost:3000/cards/count`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token, // ⬅⬅⬅ authorization token
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
  console.log(data);
  return data;
};

button.addEventListener("click", (ev) => {
  test();
});
button2.addEventListener("click", (ev) => {
  login("test", "test");
});
