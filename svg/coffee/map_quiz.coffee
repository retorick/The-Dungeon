MapQuiz = (->
    self = @

    _quizItems = QuizItemCollection.get()

    _hideResponse = ->
        els = document.getElementsByClassName('response')
        el.style.display = 'none' for el in els

        document.getElementById('state_name').value = ''
        document.getElementById('state_name').focus()
        return

    _handleResponseCorrect = ->
        #document.getElementById('correct').style.display = 'block'
        return

    _showResponseIncorrect = (expected) ->
        document.getElementById('expected').innerHTML = expected
        document.getElementById('incorrect').style.display = 'block'
        return

    _selectRandomItem = ->
        self.currentQuizItem = _quizItems.selectRandomItem()
        return

    _removeAttentionFromItem = ->
        self.currentQuizItem.unhighlight() if self.currentQuizItem
        return

    _callAttentionToItem = ->
        self.currentQuizItem.highlight()
        return

    _presentItem = (next = true) ->
        _removeAttentionFromItem()
        unless _quizItems.empty()
            if next
                _selectRandomItem()

            _callAttentionToItem()
        else
            alert("Done!")

        return

    obj = {
        init: (rObj) ->
            # initialize input field.
            document.getElementById('answer').onblur = ->
                _answer = document.getElementById('answer').value
                MapQuiz.checkAnswer(_answer)
                false

            @rObj = rObj

            rObj.forEach((el) ->
                _quizItems.add(new QuizItem({
                    id: el.id,
                    contextObj: rObj,
                    asked: false,
                    remedial: false,
                    correctResponse: el.data('capital'),
                    highlightFn: ((obj, id) -> 
                        ->
                            obj.getById(id).animate({fill: 'red'}, 1500)
                            return
                    )(rObj, el.id)
                    
                    unhighlightFn: ((obj, id) ->
                        (remedial) ->
                            _color = if not remedial then 'green' else 'orange'
                            obj.getById(id).animate({fill: _color}, 500)
                            return
                    )(rObj, el.id)
                }))
            )

            return

        beginQuiz: ->
            _presentItem()
            return

        checkAnswer: (answer) ->
            _isCorrect = self.currentQuizItem.isCorrectAnswer(answer)
            _getNextItem = true
            if _isCorrect
                _handleResponseCorrect()
            else
                _showResponseIncorrect(self.currentQuizItem.correctResponse)
                _getNextItem = false
            _presentItem(_getNextItem)
            return

    }

    obj
)()
