
// ======================================
// SHOWBOX - TV SHOWS WEBSITE
// Using TVMaze API
// ======================================

// API URLs
const API = "https://api.tvmaze.com/shows";
const SEARCH_API = "https://api.tvmaze.com/search/shows?q=";


// Get HTML elements
const grid = document.getElementById("grid");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const genreList = document.getElementById("genre-list");
const sortSelect = document.getElementById("sort");
const statusText = document.getElementById("status");
const resetButton = document.getElementById("reset-button");
const themeToggle = document.getElementById("theme-toggle");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const closeButton = modal.querySelector(".close");


// Store shows and selected genre
let shows = [];
let allGenres = [];
let selectedGenre = "all";


// ======================================
// 1. LOAD SHOWS FROM API
// ======================================

async function loadShows(url = API) {

    try {

        statusText.textContent = "Loading shows...";
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                Loading shows...
            </div>
        `;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Could not load shows");
        }

        const data = await response.json();

        // Search API returns objects containing show
        // Main API returns shows directly
        shows = data.map(item => item.show || item);

        // Remove invalid results
        shows = shows.filter(show => show && show.id);

        // Load genres from the main API
        if (allGenres.length === 0) {
            await loadGenres();
        }

        renderShows();

    } catch (error) {

        console.error("API Error:", error);

        statusText.textContent = "Something went wrong.";

        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <h3 class="text-2xl font-bold text-red-700">
                    Oops! Something went wrong.
                </h3>
                <p class="text-gray-600 mt-2">
                    Please check your internet connection and try again.
                </p>
                <button onclick="loadShows()"
                    class="mt-5 bg-red-700 text-white px-6 py-3 rounded-full">
                    Try Again
                </button>
            </div>
        `;
    }
}


// ======================================
// 2. LOAD GENRES
// ======================================

async function loadGenres() {

    try {

        const response = await fetch(API);

        if (!response.ok) {
            throw new Error("Could not load genres");
        }

        const data = await response.json();

        // Get all genres and remove duplicates
        allGenres = [
            ...new Set(
                data.flatMap(show => show.genres || [])
            )
        ];

        // Create genre buttons
        genreList.innerHTML = `
            <button
                type="button"
                data-genre="all"
                class="genre-button bg-red-700 text-white px-6 py-3 rounded-full font-semibold">
                All Genres
            </button>

            ${allGenres.map(genre => `
                <button
                    type="button"
                    data-genre="${escapeHTML(genre)}"
                    class="genre-button bg-[#eee0d1] text-[#211b18] px-6 py-3 rounded-full hover:bg-red-700 hover:text-white transition">
                    ${escapeHTML(genre)}
                </button>
            `).join("")}
        `;

    } catch (error) {

        console.error("Genre Error:", error);
        genreList.innerHTML = "";
    }
}


// ======================================
// 3. SELECT GENRE
// ======================================

genreList.addEventListener("click", function (event) {

    const button = event.target.closest(".genre-button");

    if (!button) return;

    selectedGenre = button.dataset.genre;

    updateGenreButtons();

    renderShows();
});


function updateGenreButtons() {

    const buttons = genreList.querySelectorAll(".genre-button");

    buttons.forEach(button => {

        if (button.dataset.genre === selectedGenre) {

            button.className =
                "genre-button bg-red-700 text-white px-6 py-3 rounded-full font-semibold";

        } else {

            button.className =
                "genre-button bg-[#eee0d1] text-[#211b18] px-6 py-3 rounded-full hover:bg-red-700 hover:text-white transition";
        }
    });
}


// ======================================
// 4. DISPLAY SHOWS
// ======================================

function renderShows() {

    let filteredShows = [...shows];

    // Filter by genre
    if (selectedGenre !== "all") {

        filteredShows = filteredShows.filter(show =>
            show.genres && show.genres.includes(selectedGenre)
        );
    }

    // Sort shows
    const sortValue = sortSelect.value;

    if (sortValue === "rating") {

        filteredShows.sort((a, b) =>
            (b.rating?.average || 0) - (a.rating?.average || 0)
        );

    } else if (sortValue === "name") {

        filteredShows.sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }


    // Update results information
    statusText.textContent =
        `${filteredShows.length} shows found`;


    // Empty state
    if (filteredShows.length === 0) {

        grid.innerHTML = `
            <div class="col-span-full text-center py-16">
                <h3 class="text-2xl font-bold">
                    No Shows Found
                </h3>

                <p class="text-gray-500 mt-2">
                    Try another search or genre.
                </p>
            </div>
        `;

        return;
    }


    // Create show cards
    grid.innerHTML = filteredShows.map(show => {

        const image = show.image
            ? show.image.medium
            : "https://placehold.co/300x450?text=No+Image";

        const rating = show.rating?.average
            ? show.rating.average.toFixed(1)
            : "N/A";

        const genres = show.genres?.length
            ? show.genres.slice(0, 2).join(" • ")
            : "Unknown Genre";

        return `
            <article
                class="show-card group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-2 transition duration-300 cursor-pointer"
                data-id="${show.id}">

                <div class="relative h-80 overflow-hidden bg-gray-200">

                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(show.name)}"
                        loading="lazy"
                        class="w-full h-full object-cover group-hover:scale-105 transition duration-500">

                    <div class="absolute top-3 left-3 bg-black/80 text-white px-3 py-2 rounded-full text-sm font-bold">
                        ⭐ ${rating}
                    </div>

                </div>

                <div class="p-4">

                    <h3 class="font-bold text-lg truncate">
                        ${escapeHTML(show.name)}
                    </h3>

                    <p class="text-sm text-gray-500 mt-2">
                        ${escapeHTML(genres)}
                    </p>

                </div>

            </article>
        `;

    }).join("");
}


// ======================================
// 5. SEARCH SHOWS
// ======================================

searchForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const searchValue = searchInput.value.trim();

    // Reset genre when starting a new search
    selectedGenre = "all";

    updateGenreButtons();

    if (searchValue === "") {

        loadShows();

    } else {

        loadShows(
            SEARCH_API + encodeURIComponent(searchValue)
        );
    }
});


// ======================================
// 6. SORT SHOWS
// ======================================

sortSelect.addEventListener("change", function () {

    renderShows();

});


// ======================================
// 7. RESET FILTERS
// ======================================

resetButton.addEventListener("click", function () {

    searchInput.value = "";

    selectedGenre = "all";

    sortSelect.value = "default";

    updateGenreButtons();

    loadShows();

});


// ======================================
// 8. OPEN SHOW DETAILS
// ======================================

grid.addEventListener("click", function (event) {

    const card = event.target.closest(".show-card");

    if (!card) return;

    const showId = Number(card.dataset.id);

    const selectedShow = shows.find(show =>
        show.id === showId
    );

    if (selectedShow) {
        openModal(selectedShow);
    }
});


function openModal(show) {

    const image = show.image
        ? show.image.original || show.image.medium
        : "https://placehold.co/300x450?text=No+Image";

    const rating = show.rating?.average
        ? show.rating.average.toFixed(1)
        : "Not Rated";

    const genres = show.genres?.length
        ? show.genres.join(" • ")
        : "Unknown";

    // Remove HTML tags from summary
    const summary = show.summary
        ? show.summary.replace(/<[^>]*>/g, "")
        : "No description available.";

    modalBody.innerHTML = `

        <div class="flex flex-col md:flex-row gap-6">

            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(show.name)}"
                class="w-full md:w-56 h-72 object-cover rounded-xl">

            <div class="flex-1">

                <h2 class="text-3xl font-bold text-red-700 mb-3">
                    ${escapeHTML(show.name)}
                </h2>

                <p class="mb-3">
                    ⭐ <strong>Rating:</strong> ${rating}
                </p>

                <p class="mb-3">
                    <strong>Genres:</strong> ${escapeHTML(genres)}
                </p>

                <p class="mb-3">
                    <strong>Language:</strong>
                    ${escapeHTML(show.language || "Unknown")}
                </p>

                <p class="mb-3">
                    <strong>Status:</strong>
                    ${escapeHTML(show.status || "Unknown")}
                </p>

                <p class="text-gray-700 leading-relaxed mt-5">
                    ${escapeHTML(summary)}
                </p>

                ${show.officialSite ? `
                    <a
                        href="${escapeHTML(show.officialSite)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-block mt-6 bg-red-700 text-white px-6 py-3 rounded-full hover:bg-red-800 transition">
                        Official Website ↗
                    </a>
                ` : ""}

            </div>

        </div>
    `;

    // Show modal
    modal.classList.remove("hidden");
    modal.classList.add("flex");

    document.body.classList.add("overflow-hidden");
}


// ======================================
// 9. CLOSE MODAL
// ======================================

function closeModal() {

    modal.classList.add("hidden");
    modal.classList.remove("flex");

    document.body.classList.remove("overflow-hidden");
}


closeButton.addEventListener("click", closeModal);


// Close modal when clicking outside
modal.addEventListener("click", function (event) {

    if (event.target === modal) {
        closeModal();
    }

});


// Close modal using Escape key
document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {
        closeModal();
    }

});


// ======================================
// 10. DARK MODE
// ======================================

themeToggle.addEventListener("click", function () {

    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    if (isDark) {

        document.body.style.backgroundColor = "#171717";
        document.body.style.color = "#ffffff";

        themeToggle.textContent = "☀";

    } else {

        document.body.style.backgroundColor = "#fbf1e5";
        document.body.style.color = "#211b18";

        themeToggle.textContent = "☾";
    }

});


// ======================================
// 11. ESCAPE HTML
// ======================================

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function (character) {

        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];

    });
}


// ======================================
// 12. START WEBSITE
// ======================================

loadShows();
