/*
 * Cell object:  contains "under-the-hood" data for each cell in the spreadsheet.
 *      Each cell has a list of other cells that depend on its value.  Whenever
 *      a cell's value changes, each "listener" cell is notified so it can be 
 *      updated.
 *
 *      The id parameter, which is passed to the constructor when a new cell is
 *      created, is a string containing the standard spreadsheet cell reference; 
 *      e.g., B5.
 *      
 */
function Cell(id) {
    // array of cell objects that are listening to current cell.
    this.listeners = [];
    this.id = id;
    this.value = '';
    this.formula = '';
    this.error = 0; // error in cell?
    // list gathered by parser each time a cell changes.
    this.cellsToListenTo = [];
    // listensTo memo: array of cell objects to which the current cell is listening.
    //       This is maintained to make it easy to unsubscribe from cells no longer
    //       referenced in the formula.
    this.listensTo = [];
}


/*
 * propagateChange method:  iterates through the context Cell object's
 *      listeners (which are themselves Cell objects) and invokes the
 *      setValueAndFormula method for each.
 */
Cell.prototype.propagateChange = function() {
    var cell;
    // here, we may want to compute the value based on the formula, not rely on a "value" property.
    var newValue = this.value;
    for (var i = 0, j = this.listeners.length; i < j; i++) {
        cell = this.listeners[i];
        cell.setValueAndFormula(cell.formula, true);
    }
    return this;
};


/*
 * hasListener method:  check the listeners chain for a cell to see if it includes
 *      a particular cell.  The purpose for this is to detect circuluar references.
 */
Cell.prototype.hasListener = function(subscriber) {
    var circularReferences = [];
    var hasListener = false;
    var publisher = this;

    // _checkForListener gets called recursively, as each subscriber can also be a publisher.
    function _checkForListener(publisher) {
        var hasListener = false;
        var _pub, ndx = 0;
        while (hasListener === false && ndx < publisher.listeners.length) {
            _pub = publisher.listeners[ndx];
//            circularReferences.push(_pub.id); // add each ID to reference path.
            if (_pub === subscriber) {
                hasListener = true;
            }
            else {
                if (_pub.listeners.length > 0) {
                    hasListener = _checkForListener(_pub);
                }
            }
            ndx++;
        }
        if (hasListener) {
            circularReferences.push(_pub.id); // add each ID to reference path.
        }
        return hasListener;
    }

    if (subscriber === publisher || _checkForListener(publisher)) {
        hasListener = true;
        circularReferences.push(publisher.id);
    }

    return circularReferences;
};


/*
 * beginListening method:  receives a Cell object (cellObj) from which the 
 *      context Cell object needs to receive notifications of updates.
 *      The context object is added to the listeners for the object received
 *      as a parameter.
 * 
 *      For instance, suppose cell B5 has just been updated to contain the
 *      formula '=A1*B1/2'.  The Cell objects for both A1 and B1 need to be
 *      informed that B5 is listening for their values so that if either of them
 *      changes, it can change as well.  
 */
Cell.prototype.beginListening = function(publisher) {
    var that = this;
    var alreadyListening = publisher.listeners.some(
        function(c) {
            return that === c;
        }
    );
    var circularReferences = this.hasListener(publisher);
    try {
        if (circularReferences.length > 0) {
/*
            circularReferences.forEach(
                function(id) {
                    CellManager.cells[id].value = null;
                    CellManager.cells[id].error = 2;
                    Cell.prototype.refreshCellDisplay.call(CellManager.cells[id]);
                }
            );
*/
            this.value = null;
            this.error = 2;
            throw '[beginListening] Circular reference on ' + this.id;
        }
        else if (!alreadyListening) {
            publisher.listeners.push(this);
            this.listensTo.push(publisher);
        }
    }
    catch (e) {
        console.log(e);
    }
    return this;
};


/*
 * stopListening method:  used when a cell's formula no longer contains a 
 *      reference to a certain other cell.  The cell then needs to be removed
 *      from that other cell's listeners array.
 */
Cell.prototype.stopListening = function(publisher) {
    var ndx = publisher.listeners.indexOf(this);
    publisher.listeners.splice(ndx, 1);    
    ndx = this.listensTo.indexOf(publisher);
    this.listensTo.splice(ndx, 1);
};


/*
 * subscribeToReferencedCells method:  the Parser generates a list of cell IDs
 *      contained in a cell's formula and makes this available for assignment
 *      to the Cell object's cellsToListenTo property.
 *      The subscribeToReferencedCells method iterates through this array and
 *      invokes the Cell object's beginListening method, passing the cell
 *      object to which the cell must listen, as described in the beginListening
 *      comments.
 */
Cell.prototype.subscribeToReferencedCells = function() {
    var thisCell = this;
    this.listensTo.forEach(
        function(cellObj) {
            var id = cellObj.id;
            // if the cell's new formula does not include cell references to cells this cell used to listen to, have it stop listening to them.
            if (thisCell.cellsToListenTo.indexOf(id) === -1) {
                thisCell.stopListening(cellObj);
            }
        }
    );
    this.cellsToListenTo.forEach(
        function(id) {
            // cellObj is the Cell object for each cell whose ID is listed in cellsToListenTo.
            var cellObj = CellManager.cells[id];
            thisCell.beginListening(cellObj);
        }
    );
};


/*
 * setValueAndFormula method:  invoked whenever a change is detected in a cell's
 *      content.  This happens directly through CellManager.checkStatus, in the
 *      event that Cell object content is found to differ from entered content.
 *      In this case, the cellContent parameter is the literal content that was
 *      entered into the cell, and the isFormula flag is set to true if that
 *      content was determined to be a formula (first character is '=').
 *
 *      This method is also invoked by Cell.propagateChange, in which case a
 *      cell's existing formula is passed as the cellContent and the isFormula
 *      flag is set to true.  In this case, a cell to which the cell is listening
 *      has been modified, and this cell must re-evaluate its formula in order
 *      to determine the correct value to display.
 *
 *      Parameters:
 *        cellContent:  the literal content entered into the cell.
 *        isFormula:  true if the content is a formula; false otherwise.
 *      
 *      Set the Cell object's value, formula, and error properties.  If the
 *      cell content is a formula, the value is the result of parsing the formula.
 *      Otherwise, the value and the formula are the same.
 *
 *      Once the Cell properties have been updated, three things must happen:
 *      * The Cell must begin listening to any cells referenced in the formula.
 *      * The spreadsheet must be update to reflect the cell value (important
 *        if a formula was entered).
 *      * The Cell object must propagate its changes to any cells that depend
 *        on its value.
 *        
 */
Cell.prototype.setValueAndFormula = function(cellContent, isFormula) {
    var newValue = cellContent, newFormula = cellContent;
    if (isFormula) {
        newValue = Parser.parse(cellContent);
        this.cellsToListenTo = Parser.cellsReferenced;
    }

    this.error = newValue === null ? 1 : 0; // will only occur with parse error in formula.
    if (newValue !== this.value) { // no need to update value and propagate change unless value has changed.
        this.value = newValue;
        this.propagateChange();    
    }
    if (newFormula !== this.formula) { // no need to update formula or subscriptions unless formula has changed.
        this.formula = newFormula;
    }
    this.subscribeToReferencedCells(); // this happens even for a literal value, since it includes a de-subscribe method.
    this.refreshCellDisplay(); // this actually doesn't need to happen if the cell contains a value that hasn't changed.
};


/*
 * refreshCellDisplay method:  Simply updates the DOM element representing the
 *      context Cell object.
 *
 *      If the cell's value is a null, indicating an error in the formula, or
 *      in a formula of a cell in the listening chain, an error indicator is
 *      displayed.
 */
Cell.prototype.refreshCellDisplay = function() {
    var cell = document.getElementById(this.id);
    if (this.error === 1) {
        cell.innerHTML = '!ERROR';
    }
    else if (this.error === 2) {
        cell.innerHTML = '!REF';
    }
    else {
        cell.innerHTML = this.value;
    }
};



/*
 * CellManager object:  maintains array of all Cell objects in the spreadsheet.
 * 
 * initializeCells method:  invoked when the spreadsheet is loaded:  builds
 *      an array containing a Cell object for each cell in the spreadsheet, as
 *      determined by the specified number of rows (spreadsheetParams.rows) and
 *      columns (spreadsheetParams.cols).
 *
 * checkStatus method:  invoked whenever a blur event is detected on a cell
 *      DOM element.  Method is also invoked when a deletion event is detected.
 *      This method compares the cell's literal content with the formula in the
 *      cell's corresponding Cell object.  If the two differ, indicating the
 *      cell has been updated, the setValueAndFormula method is invoked for
 *      the Cell object.
 *
 * lookup method:  returns the Cell object's value property.  If the cell
 *      contains a formula, this property is the result of evaluating that
 *      formula.
 */
CellManager = (function() {
    return {
        currentlyActive: null,

        initializeCells: function() {
            var cells = {},
                id;
            for (var y = 0; y < spreadsheetParams.rows; y++) {
                for (var x = 0; x < spreadsheetParams.cols; x++) {
                    linearNdx = y*spreadsheetParams.cols + x;
                    id = String.fromCharCode(65 + x) + (y + 1);
                    cells[id] = new Cell(id);
                }
            }
            this.cells = cells;
        },

        checkStatus: function(obj) {
            var id = obj.id;
            var currentFormula = this.cells[id].formula;
            var cellContent = obj.innerHTML;
            var newContent = cellContent;
            var triggerUpdate = false;
            var isFormula = false;

            if (cellContent.charAt(0) === '=') {
                newContent = cellContent.toUpperCase();
                isFormula = true;
            }
            triggerUpdate = newContent != currentFormula;
            if (triggerUpdate || isFormula) {
                this.cells[id].setValueAndFormula(newContent, isFormula);
            }
        },

        lookup: function(coords) {
            return this.cells[coords].value;
        }

    };
})();
