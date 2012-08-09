HelpEvents = (function() {
    return {
        close: function() {
            var panel = document.getElementById('help-instructions');

            panel.style.display = 'none';
        }
    };
})();

Help = (function() {
    return {
        display: function() {
            var panel = document.getElementById('help-instructions');

            panel.style.display = 'block';
        },

        instructions: function() {
            this.panel = document.getElementById('help-instructions');
        },

        init: function() {
            var el = document.createElement('div');
            var closeEl = document.createElement('div');
            var closexEl = document.createElement('div');
            var frameEl = document.createElement('iframe');
            frameEl.src = 'help/instructions.html';
            el.id = 'help-instructions';
            el.className = 'help';
            closeEl.id = 'btn-close-help';
            closexEl.id = 'btn-close-help-x';
            closexEl.innerHTML = 'x';
            closeEl.appendChild(closexEl);
            closeEl.onclick = HelpEvents.close;
            el.appendChild(closeEl);
            el.appendChild(frameEl);
            
            document.getElementById('table-container').appendChild(el);
        },

        plug: null
    }
})();

