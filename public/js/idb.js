

// CREATE A VARIABLE TO HOLD A DB CONNECTION
let db;

// ESTABLISH A CONNECTION TO INDEXEDDB DATABASE CALLED 'budget_tracker' AND SET TO VERSION 1
const request = indexedDB.open('budget_tracker', 1);

// THIS EVENT WILL EMIT IF THE DATABASE VERSION CHANGES (NONEXISTANT TO VERSION 1, V1 TO V2, ETC.)
request.onupgradeneeded = function(event) {
    //SAVE A REFERENCE TO THE DATABASE
    const db = event.target.result;
    // CREATE AN OBJECT STORE (TABLE) CALLED 'new_item', SET IT TO HAVE AN AUTO INCREMENTING PRIMARY KEY OF SORTS
    db.createObjectStore('new_item', {autoIncrement: true} );
};

// UPON SUCCESS
request.onsuccess = function(event) {
    // WHEN DB IS SUCCESSFULLY CREATED WITH ITS OBJECT STORE (FROM ABOVE EVENT) OR SIMPLY ESTABLISHED A CONECTION, SAVE REFERENCE TO DB IN GLOBAL VARIABLE
    db = event.target.result;

    // CHECK IF APP IS ONLINE, IF YES RUN uploadItem() TO SEND ALL LOCAL DB DATA TO API
    if (navigator.onLine) {
        uploadItem();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// THIS FUNCTION WILL BE EXECUTED IF WE ATTEMPT TO SUBMIT A NEW PIZZA AND THERE IS NO INTERNET CONNECTION
function saveRecord(record) {
    // OPEN A NEW TRANSACTION WITH THE DATABASE WITH READ AND WRITE PERMISSIONS
    const transaction = db.transaction(['new_item'], 'readwrite');

    // ACCESS THE OBJECT STORE FOR 'new_item'
    const itemObjectStore = transaction.objectStore('new_item');

    // ADD RECORD TO YOUR STORE WITH ADD METHOD
    itemObjectStore.add(record);
}

function uploadItem() {
    // OPEN A TRANSACTION ON YOUR DB
    const transaction = db.transaction(['new_item'], 'readwrite');

    // ACCESS YOUR OBJECT STORE
    const itemObjectStore = transaction.objectStore('new_item');

    // GET ALL RECORDS FROM STORE AND SET UP TO A VARIABLE
    const getAll = itemObjectStore.getAll();

    // UPON A SUCCESSFUL .GETALL() EXECUTION, RUN THIS FUNCTION
    getAll.onsuccess = function() {
        // IF THERE WAS DATA IN INDEXEDDB'S STORE, LET'S SEND IT TO THE API SERVER
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type' : 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // OPEN ONE MORE TRANSACTION
                const transaction = db.transaction(['new_item'], 'readwrite');
                // ACCESS THE NEW ITEM OBJECT STORE
                const itemObjectStore = transaction.objectStore('new_item');
                // CLEAR ALL ITEMS IN STORE
                itemObjectStore.clear();

                alert('All saved items have been submitted');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
}

window.addEventListener('online', uploadItem);
