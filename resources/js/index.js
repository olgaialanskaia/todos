// Create needed constants
const list = document.querySelector('ul');
const todoInput = document.querySelector('#td-input');
const form = document.querySelector('form');
const submitBtn = document.querySelector('.td-btn--adding');

// Create an instance of a db object for us to store the open database in
let db;

window.onload = function() {

// Open our database; it is created if it doesn't already exist
// (see onupgradeneeded below)
let request = window.indexedDB.open('todos', 1);

// onerror handler signifies that the database didn't open successfully
request.onerror = function() {
  console.log('Database failed to open');
};

// onsuccess handler signifies that the database opened successfully
request.onsuccess = function() {
  console.log('Database opened successfully');

  // Store the opened database object in the db variable
  db = request.result;

  // Run the displayData() function to display the todos already in the IDB
  displayData();
};

// Setup the database tables if this has not already been done
request.onupgradeneeded = function(e) {
  // Grab a reference to the opened database
  let db = e.target.result;

  // Create an objectStore to store our todos in (basically like a single table)
  // including a auto-incrementing key
  let objectStore = db.createObjectStore('todos', { keyPath: 'id', autoIncrement:true });

  // Define what data items the objectStore will contain
  objectStore.createIndex('body', 'body', { unique: false });
  objectStore.createIndex('todostatus', 'todostatus', { unique: false });

  console.log('Database setup complete');
};

// Create an onsubmit handler so that when the form is submitted the addData() function is run
form.onsubmit = addData;

// Define the addData() function
function addData(e) {
  // prevent default - we don't want the form to submit in the conventional way
  e.preventDefault();

  // grab the values entered into the form fields and store them in an object ready for being inserted into the DB
  let newItem = { body: todoInput.value };

  // open a read/write db transaction, ready for adding the data
  let transaction = db.transaction(['todos'], 'readwrite');

  // call an object store that's already been added to the database
  let objectStore = transaction.objectStore('todos');

  // Make a request to add our newItem object to the object store
  var request = objectStore.add(newItem);
  request.onsuccess = function() {
    // Clear the form, ready for adding the next entry
    todoInput.value = '';
  };

  // Report on the success of the transaction completing, when everything is done
  transaction.oncomplete = function() {
    console.log('Transaction completed: database modification finished.');

    // update the display of data to show the newly added item, by running displayData() again.
    displayData();
  };

  transaction.onerror = function() {
    console.log('Transaction not opened due to error');
  };
}

// Define the displayData() function
function displayData() {
  // Here we empty the contents of the list element each time the display is updated
  // If you didn't do this, you'd get duplicates listed each time a new todo is added
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }

  // Open our object store and then get a cursor - which iterates through all the
  // different data items in the store
  let objectStore = db.transaction('todos').objectStore('todos');
  objectStore.openCursor().onsuccess = function(e) {
    // Get a reference to the cursor
    let cursor = e.target.result;

    // If there is still another data item to iterate through, keep running this code
    if(cursor) {
      // Create a list-item to put each data item inside when displaying it
      // structure the HTML fragment, and append it inside the list
      let listItem = document.createElement('li');
      listItem.className = 'td-list-item';

      // Create a checkbox and append it before each list-item
      let checkbox = document.createElement('input');
      checkbox.className = 'td-checkbox';
      checkbox.name = 'td-checkbox';
      checkbox.type = 'checkbox';
      checkbox.checked = cursor.value.checked ? true: null;

      // Create custom checkbox
      // structure the HTML fragment, and append it inside the list-item
      let checkboxLabel = document.createElement('label');
      checkboxLabel.className = 'td-checkbox-label';

      let customCheckbox = document.createElement('span');
      customCheckbox.className = 'td-checkbox-custom';

      let todoText = document.createElement('span');
      todoText.className = 'td-todo-text';

      listItem.appendChild(checkbox);
      checkboxLabel.appendChild(customCheckbox);
      listItem.append(checkboxLabel);
      checkboxLabel.appendChild(todoText);
      list.appendChild(listItem);

      // Put the data from the cursor inside the todo text area
      todoText.textContent = cursor.value.body;

      // Store the ID of the data item inside an attribute on the listItem, and checkbox so we know
      // which item it corresponds to. This will be useful later when we want to delete items or update items.
      listItem.setAttribute('data-todo-id', cursor.value.id);
      checkbox.setAttribute('id', cursor.value.id);
      checkboxLabel.setAttribute('for', cursor.value.id);

      // Create a delete button and place it inside each listItem
      let deleteBtn = document.createElement('button');
      deleteBtn.className = 'td-btn td-btn--deleting';
      listItem.appendChild(deleteBtn);
      deleteBtn.textContent = 'x';

      // Set an event handler so that when the button is clicked, the deleteItem()
      // function is run
      deleteBtn.onclick = deleteItem;

      // Set an event handler so that when the checkbox is clicked, the addCheckboxStatus()
      // function is run
      checkbox.onchange = addCheckboxStatus;

      // Iterate to the next item in the cursor
      cursor.continue();
    } else {
      // Again, if list item is empty, display a 'No todos stored' message
      if(!list.firstChild) {
        let listItem = document.createElement('li');
        listItem.className = 'td-is-empty';
        listItem.textContent = 'No todos stored.';
        list.appendChild(listItem);
      }
      // if there are no more cursor items to iterate through, say so
      console.log('Todos all displayed');
    }
  };
}

// Define the addCheckboxStatus() function
function addCheckboxStatus(e) {
  // Here we save the state of the checkbox for each item
  // open a read/write db transaction, ready for adding the data
  let transaction = db.transaction(['todos'], 'readwrite');

  // call an object store that's already been added to the database
  let objectStore = transaction.objectStore('todos');

  // save a checkbox state of the element that triggered this event
  let checkbox = e.target['checked'];
  console.log("value:" + checkbox);

  // access a table and column where you want to save an item checked status
  let myIndex = objectStore.index('body');

  // save the id of the element that triggered a click checkbox event
  let idx = Number(e.target['id']);

  // access an id of the item from db
  let todoStatus = objectStore.get(idx);
  console.log("my id:" + e.target['id']);

  // upon getting an item id from db proceed with a db record update
  todoStatus.onsuccess = function() {
    // store an id of the item retrieved from db
    let data = todoStatus.result;
    console.log("Result:" + data);
    console.log(todoStatus);
    console.log("value:" + checkbox);

    // define the checkbox status of this item
    data['checked'] = checkbox;

    // make a request to save the checkbox status
    let request = objectStore.put(data);
  };

  // Report on the success of the transaction completing, when everything is done
  transaction.oncomplete = function() {
    console.log('Transaction completed: database modification finished.');
  }

  // Report on the failure of the transaction opening, when attempting to save the checkbox status
  transaction.onerror = function() {
    console.log('Transaction not opened due to error');
  }
}

// Define the deleteItem() function
function deleteItem(e) {
  // retrieve the name of the task we want to delete. We need
  // to convert it to a number before trying it use it with IDB; IDB key
  // values are type-sensitive.
  let todoId = Number(e.target.parentNode.getAttribute('data-todo-id'));

  // open a database transaction and delete the task, finding it using the id we retrieved above
  let transaction = db.transaction(['todos'], 'readwrite');
  let objectStore = transaction.objectStore('todos');
  let request = objectStore.delete(todoId);

  // report that the data item has been deleted
  transaction.oncomplete = function() {
    // delete the parent of the button
    // which is the list item, so it is no longer displayed
    e.target.parentNode.parentNode.removeChild(e.target.parentNode);
    console.log('todo ' + todoId + ' deleted.');

    // Again, if list item is empty, display a 'No todos stored' message
    if(!list.firstChild) {
      let listItem = document.createElement('li');
      listItem.className = 'td-is-empty';
      listItem.textContent = 'No todos stored.';
      list.appendChild(listItem);
    }
  };
}

};
