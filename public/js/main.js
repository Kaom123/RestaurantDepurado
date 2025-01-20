const reservationForm = document.getElementById("reservation-form");

reservationForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Deshabilitar el botón durante el envío
  const submitButton = reservationForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";

  const datos = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    date: document.getElementById("date").value
  };

  try {
    // Usar la URL de la función de Netlify
    const response = await fetch("/.netlify/functions/submit-form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    });

    const result = await response.json();

    if (result.success) {
      alert("Reservación exitosa");
      reservationForm.reset();
    } else {
      alert("Error: " + result.message);
    }
  } catch (error) {
    console.error("Error al enviar los datos:", error);
    alert("Error al enviar los datos: " + error.message);
  } finally {
    // Reactivar el botón después del envío
    submitButton.disabled = false;
    submitButton.textContent = "Enviar Reserva";
  }
});

// Validación básica del formulario
function validateForm() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const date = document.getElementById("date").value;

  if (!name || !email || !phone || !date) {
    alert("Por favor, complete todos los campos");
    return false;
  }

  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Por favor, ingrese un email válido");
    return false;
  }

  return true;
}

// Validar fecha mínima
const dateInput = document.getElementById("date");
if (dateInput) {
  // Establecer la fecha mínima como hoy
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
}