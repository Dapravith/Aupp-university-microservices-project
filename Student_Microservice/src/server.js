const app = require('./app');
const PORT = Number(process.env.PORT || 5001);
app.listen(PORT, () => {
  console.log(`Student Service running on port ${PORT}`);
});
