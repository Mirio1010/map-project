/**
 * tabs.js
 *
 * Handles navigation between different "views" (Home, Explore, Profile, About)
 * in a single-page setup using vanilla JavaScript. It listens for clicks on tab
 * buttons, shows the matching section, and hides all others,  simulating a
 * basic client-side router without reloading the page.
 *
 * This manual approach helps build a strong understanding of DOM manipulation,
 * event handling, and routing logic. In frameworks like React, this entire
 * process becomes much simpler through React Router, which automatically manages
 * component rendering, URL updates, and view transitions in a cleaner, more
 * declarative way. 
 * 
 * Essentially, React would make this so much easier because you don't need to worry about manually hiding and * showing sections. It's good to know the basics though before jumping into React. 
 */

// scripts/tabs.js
document.addEventListener("DOMContentLoaded", () => {
  const tabsList = document.querySelector(".tabs");
  const brand = document.querySelector(".brand");
  const mainHome = document.querySelector("main.layout-full");

  if (!tabsList || !mainHome) {
    console.warn("Tabs or main layout not found. Tabs will not initialize.");
    return;
  }

  // Immediately hide any existing .view elements to avoid flashes
  document.querySelectorAll(".view").forEach((v) => {
    v.style.display = "none";
    v.setAttribute("aria-hidden", "true");
  });

  // Helper: ensure there's a view element for a route. If missing, create a placeholder (hidden).
  function ensureView(route) {
    // Home uses the existing main.layout-full
    if (route === "home") return mainHome;

    // Look for an existing section.view[data-route="..."]
    let view = document.querySelector(`.view[data-route="${route}"]`);
    if (view) return view;

    // If none exists, create a simple placeholder view (start hidden to prevent flash)
    view = document.createElement("section");
    view.className = "view p-8";
    view.dataset.route = route;
    view.setAttribute("aria-label", `${route} view`);
    view.style.display = "none"; // <-- keep it hidden until showRoute runs
    view.setAttribute("aria-hidden", "true");
    view.innerHTML = `<h2 style="margin-top:0; text-transform:capitalize">${route}</h2>
                      <p>This is a placeholder for the <strong>${route}</strong> page. Add your content to a section with <code>class="view" data-route="${route}"</code> in your HTML to replace this placeholder.</p>`;
    // insert after the main element
    mainHome.after(view);
    return view;
  }

  // Build a list of tab buttons which have a data-route attribute
  const tabButtons = Array.from(
    tabsList.querySelectorAll('[role="tab"][data-route]')
  );

  // Create views for every tab if they don't already exist (they will be created hidden)
  const routes = tabButtons.map((b) => b.dataset.route);
  routes.forEach((r) => ensureView(r));

  // Show the selected route and hide others
  function showRoute(route) {
    // Views include mainHome (home) plus any .view elements
    const allViews = [
      mainHome,
      ...Array.from(document.querySelectorAll(".view")),
    ];

    allViews.forEach((v) => {
      const vRoute = v === mainHome ? "home" : v.dataset.route;
      const shouldShow = vRoute === route;
      v.style.display = shouldShow ? "" : "none";
      v.setAttribute("aria-hidden", shouldShow ? "false" : "true");

      // optional class toggle for styling
      if (shouldShow) v.classList.add("active");
      else v.classList.remove("active");
    });

    // update tabs aria-selected
    tabButtons.forEach((btn) => {
      const isSelected = btn.dataset.route === route;
      btn.setAttribute("aria-selected", isSelected ? "true" : "false");
      if (isSelected) btn.classList.add("tab--active");
      else btn.classList.remove("tab--active");
    });

    // update hash without adding history entries
    try {
      history.replaceState(null, "", `#${route}`);
    } catch (e) {
      // ignore (some browsers in file:// might throw)
    }
  }

  // Click handler for tabs (event delegation inside the tab list)
  tabsList.addEventListener("click", (e) => {
    const btn = e.target.closest('[role="tab"][data-route]');
    if (!btn) return;
    e.preventDefault();
    showRoute(btn.dataset.route);
  });

  // Brand click -> go home
  brand?.addEventListener("click", (e) => {
    e.preventDefault();
    const route = brand.dataset.route || "home";
    showRoute(route);
  });

  // Init route: use hash if present and matches a tab, otherwise use the tab with aria-selected="true", otherwise home
  const hashRoute = location.hash ? location.hash.replace(/^#/, "") : null;
  const validRoutes = new Set(routes.concat(["home"]));
  const routeToShow =
    hashRoute && validRoutes.has(hashRoute)
      ? hashRoute
      : tabButtons.find((t) => t.getAttribute("aria-selected") === "true")
          ?.dataset.route || "home";

  // Finally, show the chosen route (this will reveal only that view)
  showRoute(routeToShow);
});
