const app = require('./src/app.js');
const connectdb = require('./src/db/db.js');

connectdb();


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));