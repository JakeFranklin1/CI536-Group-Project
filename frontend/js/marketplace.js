import supabase from "./supabase-client.js";

document.addEventListener("DOMContentLoaded", async () => {
  const userDataContainer = document.getElementById("user-data");

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Display user information
      userDataContainer.innerHTML = `
                <p>Email: ${user.email}</p>
                <p>ID: ${user.id}</p>
                <p>Created At: ${user.created_at}</p>
            `;
    } else {
      userDataContainer.textContent = "User not logged in.";
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    userDataContainer.textContent = "Error fetching user data.";
  }
});

// AI gen'd this code will remove
