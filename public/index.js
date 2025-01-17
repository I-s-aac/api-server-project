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

  // return data;
};
