module.exports = function (app, addon) {

    // Render the macro by returning a hello world html message
    app.get('/macro', addon.authenticate(), function (req, res) {
            res.send('<h1>Hello world</h1>');
        }
    );

};
