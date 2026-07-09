// ========================================
// Aventura Menu Studio
// Buffet Builder
// ========================================

let menuItems = [];
let buffetItems = [];

const library = document.getElementById("menuLibrary");
const search = document.getElementById("menuSearch");
const currentBuffet = document.getElementById("currentBuffet");
const buffetName = document.getElementById("buffetName");
const buffetList = document.getElementById("buffetList");
const saveButton = document.getElementById("saveBuffet");
const newButton = document.getElementById("newBuffet");
const generateCardsButton = document.getElementById("generateCards");

let savedBuffets = [];

// Load menu items
async function loadMenu() {

    const response = await fetch("data.json");

    menuItems = await response.json();

    renderLibrary([]);

}

// Render Library
function renderLibrary(items){

    library.innerHTML="";

    if(items.length===0){

        library.innerHTML=`

            <div class="empty-search">

                <h3>Search Menu Items</h3>

                <p>Start typing above to search your menu database.</p>

            </div>

        `;

        return;

    }

    items.forEach(item=>{

        const div=document.createElement("div");

        div.className="library-item";

        div.innerHTML=`

            <span>${item.Title}</span>

            <button class="add-btn">+</button>

        `;

        div.querySelector("button").addEventListener("click",()=>{

            addItem(item);

        });

        library.appendChild(div);

    });

}

// Search
search.addEventListener("input",()=>{

    const term=search.value.trim().toLowerCase();

    if(term.length<2){

        renderLibrary([]);

        return;

    }

    const filtered=menuItems.filter(item=>

        item.Title.toLowerCase().includes(term)

    );

    renderLibrary(filtered.slice(0,25));

});

// Add Item
function addItem(item){

    const exists = buffetItems.some(x => x.Title === item.Title);

    if(exists){

        return;

    }

    buffetItems.push(item);

    renderCurrentBuffet();

}

// Render Current Buffet
function renderCurrentBuffet(){

    currentBuffet.innerHTML="";

    buffetItems.forEach((item,index)=>{

        const div=document.createElement("div");

        div.className="menu-item";

        div.innerHTML=`

            <span>☰ ${item.Title}</span>

            <button class="remove-btn">✕</button>

        `;

        div.querySelector(".remove-btn").addEventListener("click",()=>{

            buffetItems.splice(index,1);

            renderCurrentBuffet();

        });

        currentBuffet.appendChild(div);

    });

    // 👇 ADD THIS PART
    new Sortable(currentBuffet,{

        animation:200,

        ghostClass:"dragging",

        onEnd:function(evt){

            const moved = buffetItems.splice(evt.oldIndex,1)[0];

            buffetItems.splice(evt.newIndex,0,moved);

        }

    });

}

// ==========================
// Saved Buffets
// ==========================

function renderSavedBuffets(){

    buffetList.innerHTML = "";

    savedBuffets.forEach((buffet,index)=>{

        const card = document.createElement("div");

        card.className = "buffet-card";

        card.innerHTML = `

            <div class="buffet-card-header">

                <div>

                    <h3>${buffet.name}</h3>

                    <p>${buffet.items.length} Menu Items</p>

                </div>

                <button class="delete-buffet">✕</button>

            </div>

        `;

        // Delete button
        card.querySelector(".delete-buffet").addEventListener("click",(e)=>{

            e.stopPropagation();

            deleteBuffet(index);

        });

        // Load buffet
        card.addEventListener("click",()=>{

            buffetName.value = buffet.name;

            buffetItems = [...buffet.items];

            renderCurrentBuffet();

        });

        buffetList.appendChild(card);

    });

}

function deleteBuffet(index){

    if(!confirm("Delete this buffet?")){

        return;

    }

    savedBuffets.splice(index,1);

    localStorage.setItem(
        "aventuraBuffets",
        JSON.stringify(savedBuffets)
    );

    renderSavedBuffets();

}

function saveCurrentBuffet(){

    const name = buffetName.value.trim();

    if(name === ""){

        alert("Please enter a buffet name.");

        return;

    }

    if(buffetItems.length === 0){

        alert("Add at least one menu item.");

        return;

    }

    const existing = savedBuffets.findIndex(b=>b.name===name);

    const buffet = {

        name:name,

        items:[...buffetItems]

    };

    if(existing>=0){

        savedBuffets[existing]=buffet;

    }else{

        savedBuffets.push(buffet);

    }

    localStorage.setItem(

        "aventuraBuffets",

        JSON.stringify(savedBuffets)

    );

    renderSavedBuffets();

}

function loadSavedBuffets(){

    const data = localStorage.getItem("aventuraBuffets");

    if(data){

        savedBuffets = JSON.parse(data);

    }

    renderSavedBuffets();

}

loadMenu();

loadSavedBuffets();

saveButton.addEventListener("click",saveCurrentBuffet);

newButton.addEventListener("click",()=>{

    buffetItems=[];

    buffetName.value="";

    renderCurrentBuffet();

});

generateCardsButton.addEventListener("click", () => {

    if (buffetItems.length === 0) {

        alert("Please add at least one menu item.");
        return;

    }

    console.log("Sending buffet:", buffetItems);

    sessionStorage.setItem(
        "currentBuffet",
        JSON.stringify(buffetItems)
    );

    console.log(
        "Session Storage:",
        sessionStorage.getItem("currentBuffet")
    );

    window.location.href = "menu-editor.html";

});