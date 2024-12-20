const table = document.getElementById("gallery_table");
const table_rows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr");

function update_table() {
    for (let i = 0; i < table_rows.length; i++) {
        const sale_date_str = table_rows[i].querySelector("#sale_date").getAttribute("data-date");
        const sale_date_object = new Date(sale_date_str);
        const time_remaining = sale_date_object - Date.now();
        let time_remaining_str = "";
        if (time_remaining <= 0) {
            time_remaining_str += "Sale ended";
        } else {
            const days = Math.floor(time_remaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((time_remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((time_remaining % (1000 * 60 * 60)) / (1000 * 60));
            time_remaining_str += `${days}d ${hours}h ${minutes}m`;
        }
        table_rows[i].querySelector("#time_remaining").textContent = time_remaining_str;
    }
}

function setupMouseover() {
    for (let i = 0; i < table_rows.length; i++) {
        table_rows[i].addEventListener("mouseover", mouseoverHandler);
    }
}

function mouseoverHandler(event) {
    const row = event.currentTarget;
    const pictureHolder = document.getElementById("preview_image");
    const descrHolder = document.getElementById("preview_description");

    const image = row.querySelector("#image").textContent;
    const description = row.querySelector("#description");

    descrHolder.textContent = description.textContent;
    pictureHolder.setAttribute("src", image);
    pictureHolder.removeAttribute("hidden");
    descrHolder.removeAttribute("hidden");
}

update_table();
setupMouseover();
setInterval(update_table, 1000);

const deleteButtons = document.querySelectorAll(".delete-listing-button");

deleteButtons.forEach(button => {
    button.addEventListener("click", async (event) => {
        const listing_id = event.target.getAttribute("listing-id");
        const listingRow = document.getElementById(`row_${listing_id}`);

        try {
            const response = await fetch("/api/delete_listing", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ listing_id: listing_id })
            });

            if (response.status === 204 || response.status === 404) {
                if (listingRow) {
                    listingRow.remove();
                }
            } else if (response.status === 400 || response.status === 500) {
                alert("An error occurred while deleting the listing.");
            }
        } catch (error) {
            alert("An error occurred while deleting the listing.");
        }
    });
});