CellNavigation = (function() {
    var coords;

    function _getCoords(cellObj) {
        var id = cellObj.id,
            x = id.charCodeAt(0) - 64,
            y = id.substr(1);
        coords = { x: x, y: 1*y };
        return coords;
    }

    function _goToCell(coords) {
        var letter = String.fromCharCode(coords.x + 64),
            number = coords.y,
            targetId = letter + number;
        document.getElementById(targetId).focus();
    }

    return {
        processLtArrow: function(cellObj) {
            coords = _getCoords(cellObj);
            if (coords.x > 1) {
                coords.x--;
                _goToCell(coords);
            }
        },

        processUpArrow: function(cellObj) {
            coords = _getCoords(cellObj);
            if (coords.y > 1) {
                coords.y--;
                _goToCell(coords);
            }
        },

        processRtArrow: function(cellObj) {
            coords = _getCoords(cellObj);
            if (coords.x < spreadsheetParams.cols) {
                coords.x++;
                _goToCell(coords);
            }
        },

        processDownArrow: function(cellObj) {
            coords = _getCoords(cellObj);
            if (coords.y < spreadsheetParams.rows) {
                coords.y++;
                _goToCell(coords);
            }
        }
    };

})();


CellEvents = (function() {

    function _processTabKey(cellObj) {
    }

    function _processEnterKey(cellObj) {
        CellNavigation.processDownArrow(cellObj);
    }

    function _processDigitKey(cellObj) {
        if (data.clearFieldIfDigit) {
            cellObj.innerHTML = '';
            data.clearFieldIfDigit = false;
        }
    }

    return {
        mouseover: function() {
            var el = this.parentNode;
            el.style.backgroundColor = '#e5eecc';
        },

        mouseout: function() {
            var el = this.parentNode;
            el.style.backgroundColor = '';
        },

        keydown: function(e) {
            e = e || window.event;
            var k = e.keyCode;
            var state = true;

            switch (true) {
                case k >= 48 && k <= 57: // qwerty digits 
                case k >= 96 && k <= 105: // keypad digits
                    _processDigitKey(this);
                    break;
                case k === 9:
                    _processTabKey(this);
                    break;
                case k === 13:
                    _processEnterKey(this);
                    state = false;
                    break;
                case k === 37: // up arrow
                    CellNavigation.processLtArrow(this);
                    break;
                case k === 38: // up arrow
                    CellNavigation.processUpArrow(this);
                    break;
                case k === 39: // up arrow
                    CellNavigation.processRtArrow(this);
                    break;
                case k === 40: // down arrow
                    CellNavigation.processDownArrow(this);
                    break;
                default:
            }
            return state;
        },

        focus: function() {
            var el = this.parentNode;
            var cell = CellManager.cells[this.id];
            var formula = cell.formula;
            var value = cell.value;
            el.style.backgroundColor = '#e5eecc';
            if (value != formula) {
                this.innerHTML = '=' + formula;
            }
            else {
                this.innerHTML = value;
            }
        
        },

        blur: function() {
            var el = this.parentNode;
            el.style.backgroundColor = '';
            CellManager.checkStatus(this);
        }
    };
})();


CellManager = (function() {
    return {
        checkStatus: function() {
            console.log('Need spreadsheet.js');
        }
    };
})();


InitCell = (function() {
    function _makeCellId(x, y) {
        var colLabel = String.fromCharCode(x+64);
        var rowLabel = y;
        var cellId = colLabel + rowLabel;
        
        return cellId;
    }

    return {
        createNullCell: function() {
            return document.createTextNode('');
        },

        createWithLabel: function(label) {
            return document.createTextNode(label);
        },

        createWithCoords: function(x, y) {
            var el = document.createElement('span');
            el.contentEditable = true;
            el.onmouseover = CellEvents.mouseover;
            el.onmouseout = CellEvents.mouseout;
            el.onfocus = CellEvents.focus;
            el.onblur = CellEvents.blur;
            el.onkeydown = CellEvents.keydown;
            el.style.display = 'block';
            el.style.width = '100%';
            el.style.height = '100%';
            el.style.cursor = 'pointer';
            el.id = _makeCellId(x, y);
            return el;
        }
    };
})();


Table = (function() {
    var tableEl, tableBodyEl, trEl, tdEl;

    function _makeTableElement() {
        return document.createElement('table');
    }

    function _makeTbodyElement() {
        return document.createElement('tbody');
    }

    function _makeRowElement() {
        return document.createElement('tr');
    }

    function _makeCellElement(x, y) {
        var cellEl = 'td', cellSetup = InitCell.createNullCell();

        if (y === 0) cellEl = 'th';

        if (y === 0 && x > 0) {
            // column label
            cellSetup = InitCell.createWithLabel(String.fromCharCode(x + 64));
        }
        else if (x === 0 && y > 0) {
            // row label
            cellSetup = InitCell.createWithLabel(y);
        }
        else if (x > 0 && y > 0) {
            cellSetup = InitCell.createWithCoords(x, y);
        }
        tdEl = document.createElement(cellEl);
        tdEl.appendChild(cellSetup);

        return tdEl;
    }

    return {
        tableObject: null,

        build: function(rows, cols) {
            var rowsPlusLabel = rows + 1,
                colsPlusLabel = cols + 1;

            tableEl = _makeTableElement();
            tableBodyEl = _makeTbodyElement();

            for (var y = 0; y < rowsPlusLabel; y++) {
                trEl = _makeRowElement();
                for (var x = 0; x < colsPlusLabel; x++) {
                    trEl.appendChild(_makeCellElement(x, y));
                }
                tableBodyEl.appendChild(trEl);
            }
            tableEl.appendChild(tableBodyEl);
            this.tableObject = tableEl;
        },

        display: function() {
            var el = document.getElementById('table-container');
            el.appendChild(this.tableObject);
        }
    };
})();

var data = {
};

var spreadsheetParams = {
    rows:4,
    cols:7
};

window.onload = function() {
    Table.build(spreadsheetParams.rows, spreadsheetParams.cols);
    Table.display();
};
