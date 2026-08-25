// Product catalog for Feane Restaurant
const PRODUCTS = [
  {
    id: 1,
    name: "Delicious Pizza",
    price: 20,
    category: "pizza",
    image: "images/f1.png",
    description: "Veniam debitis quaerat officiis quasi cupiditate quo, quisquam velit, magnam voluptatem repellendus sed eaque. Fresh mozzarella, tomato sauce, and basil on a crispy crust."
  },
  {
    id: 2,
    name: "Delicious Burger",
    price: 15,
    category: "burger",
    image: "images/f2.png",
    description: "Veniam debitis quaerat officiis quasi cupiditate quo, quisquam velit, magnam voluptatem repellendus sed eaque. Juicy beef patty with cheese, lettuce, tomato, and special sauce."
  },
  {
    id: 3,
    name: "Delicious Pizza",
    price: 17,
    category: "pizza",
    image: "images/f3.png",
    description: "Veniam debitis quaerat officiis quasi cupiditate quo, quisquam velit, magnam voluptatem repellendus sed eaque. Loaded with pepperoni, mushrooms, and extra cheese."
  },
  {
    id: 4,
    name: "Delicious Pasta",
    price: 18,
    category: "pasta",
    image: "images/f4.png",
    description: "Veniam debitis quaerat officiis quasi cupiditate quo, quisquam velit, magnam voluptatem repellendus sed eaque. Creamy Alfredo pasta with grilled chicken and parmesan."
  },
  {
    id: 5,
    name: "French Fries",
    price: 10,
    category: "fries",
    image: "images/f5.png",
    description: "Veniam debitis quaerat officiis quasi cupiditate quo, quisquam velit, magnam voluptatem repellendus sed eaque. Crispy golden fries seasoned with sea salt."
  },
  {
    id: 6,
    name: "Delicious Pizza",
    price: 15,
    category: "pizza",
    image: "images/f6.png",
    description: "Veniam debitis quaerat officiis quasi cupiditate quo, quisquam velit, magnam voluptatem repellendus sed eaque. Classic margherita with fresh ingredients."
  },
  {
    id: 7,
    name: "Tasty Burger",
    price: 12,
    category: "burger",
    image: "images/f7.png",
    description: "Veniam debitis quaerat officiis quasi cupiditate quo, quisquam velit, magnam voluptatem repellendus sed eaque. Classic cheeseburger with pickles and onions."
  },
  {
    id: 8,
    name: "Tasty Burger",
    price: 14,
    category: "burger",
    image: "images/f8.png",
    description: "Veniam debitis quaerat officiis quasi cupiditate quo, quisquam velit, magnam voluptatem repellendus sed eaque. Double patty burger with bacon and BBQ sauce."
  },
  {
    id: 9,
    name: "Delicious Pasta",
    price: 10,
    category: "pasta",
    image: "images/f9.png",
    description: "Veniam debitis quaerat officiis quasi cupiditate quo, quisquam velit, magnam voluptatem repellendus sed eaque. Spaghetti Bolognese with rich meat sauce."
  }
];

function getProductById(id) {
  return PRODUCTS.find(p => p.id === parseInt(id));
}