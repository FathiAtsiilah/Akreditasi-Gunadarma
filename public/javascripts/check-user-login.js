// Cek apakah user sudah login
(async () => {
   try {
      const response = await fetch("http://localhost:3000/api/check-user", {
         method: "GET",
         credentials: "include",
      });
      const data = await response.json();
      console.log("Check user:", data);

      const authArea = document.getElementById("authArea");

      if (data.user) {
         if (window.location.pathname === "/login.html") {
            // Jika di halaman login, redirect ke homepage
            window.location.href = "/";
         }
         // Ganti tombol login jadi dropdown username
         authArea.innerHTML = `
                    <div class="dropdown">
                        <a class="btn btn-outline-primary rounded-pill dropdown-toggle" 
                           href="#" 
                           role="button" 
                           id="userMenu" 
                           data-bs-toggle="dropdown" 
                           aria-expanded="false">
                           ${data.user.username}
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userMenu">
                            <li><a class="dropdown-item" href="admin.html">Halaman Admin</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" id="logoutBtn">Logout</a></li>
                        </ul>
                    </div>
                `;

         // Tambah event listener logout
         document.getElementById("logoutBtn").addEventListener("click", async (e) => {
            e.preventDefault();
            try {
               const res = await fetch("http://localhost:3000/api/logout", {
                  method: "POST",
                  credentials: "include",
               });
               const out = await res.json();
               console.log("Logout:", out);

               // reload halaman biar balik ke tombol login
               window.location.reload();
            } catch (err) {
               console.error("Logout gagal:", err);
            }
         });
      }
      if (!data.user) {
         if (["/admin.html", "/profile.html"].includes(window.location.pathname)) {
            window.location.href = "/login.html";
         }
      }
   } catch (err) {
      console.error("Error check user:", err);
   }
})();