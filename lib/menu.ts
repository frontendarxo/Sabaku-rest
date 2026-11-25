// Items and prices transcribed from Sabaku's in-store menu board (photo, Nov 2024).
// Re-check prices with the restaurant before launch.

export interface MenuItem {
  name: string;
  note?: string;
  price: number | string;
  photo?: string;
}

export const MENU: Record<string, MenuItem[]> = {
  Food: [
    { name: "Egg Sando", note: "Fluffy bread filled with a creamy egg salad", price: 36 },
    { name: "Eggs on Toast", note: "Eggs your way on a bed of tomato jam on toast", price: 42 },
    { name: "Sabaku Shakshuka", note: "A classic shakshuka with a Japanese twist", price: 48 },
    { name: "Avocado Toast", note: "Poached eggs on avocado mash and toast", price: 46 },
    { name: "Sabaku Benedict", note: "Benedict with smoked beef sausage and red spinach", price: 48 },
    { name: "Tamagoyaki", note: "Japanese egg omelette with wasabi aioli", price: 42 },
    { name: "Omurice", note: "Japanese fried rice topped with a tornado egg", price: 54, photo: "/media/menu_omurice.webp" },
    { name: "French Toast", note: "Creamy French toast with a side of strawberry cloud", price: 42 },
    { name: "Acai Bowl", note: "Classic acai with berries and a homemade almond butter", price: 48 },
    { name: "Fluffy Pancakes", note: "Classic / Matcha / Crème Brûlée / Tiramisu", price: 50, photo: "/media/menu_pancakes.webp" },
  ],
  Dessert: [
    { name: "Dango", price: 22 },
    { name: "Hokkaido Cheese Tart", price: 16 },
    { name: "Canelé", price: 18 },
    { name: "Japanese Cheesecake", price: 36 },
    { name: "Matcha Basque", price: 28 },
    { name: "Matcha Mousse", price: 32 },
    { name: "Matcha Cheesecake Brownie", price: 25 },
    { name: "Matcha Tiramisu", price: 35, photo: "/media/menu_tiramisu.webp" },
    { name: "Matcha Lamington", price: 30 },
  ],
  "Green drinks": [
    { name: "Usucha Matcha", note: "Hot / Iced", price: 18 },
    { name: "Matcha Latte", note: "Hot / Iced", price: 30 },
    { name: "Ginger Matcha", note: "Hot / Iced", price: 35 },
    { name: "Matcha Cloud", note: "A delicate cloud of matcha floating on refreshing coconut water", price: 38 },
    { name: "Sabaku Matcha", note: "An iced camel milk matcha latte infused with desert flavours", price: 38, photo: "/media/menu_matcha.webp" },
    { name: "Sencha Cold Brew", price: 25 },
    { name: "Sencha Green Tea", price: 20, photo: "/media/menu_sencha.webp" },
    { name: "Genmaicha Green Tea", price: 20 },
    { name: "Matcha Flight", note: "A paired journey of pure matcha and a creamy matcha cortado", price: 45 },
  ],
  "Black drinks": [
    { name: "Espresso", price: 18 },
    { name: "Long Black", note: "Hot / Iced", price: 20 },
    { name: "Hand Brew", note: "Hot / Iced", price: "25/28" },
    { name: "Reserve Hand Brew", note: "Hot / Iced", price: "62/65" },
    { name: "Cold Brew", price: 25 },
    { name: "Espresso Tonic", price: 28 },
    { name: "Espresso Fizz", price: 28 },
  ],
  "White drinks": [
    { name: "Cortado", price: 21 },
    { name: "Flat White", price: 24 },
    { name: "Cappuccino", price: 23 },
    { name: "Latte", note: "Hot / Iced", price: 23 },
    { name: "Caramel Latte", note: "Hot / Iced", price: 28 },
    { name: "Sabaku Latte", note: "An iced camel milk latte infused with desert flavours", price: 38 },
    { name: "Flight", note: "A paired journey of espresso and a creamy cortado", price: 40 },
  ],
  Other: [
    { name: "Orange Juice", price: 25 },
    { name: "Hibiscus", price: 28 },
    { name: "Spice Soda", price: 25 },
    { name: "Alternative Milk", note: "Almond / Coconut / Oat", price: 5 },
  ],
};

export const DISHES = [
  {
    id: "pancakes",
    label: "Food · the one guests come back for",
    title: "Fluffy pancakes",
    note: "Classic / Matcha / Crème Brûlée / Tiramisu",
    text: "Tall, trembling and still warm — with a pat of butter, powdered sugar and syrup on the side.",
    price: 50,
    video: "/media/pancakes.mp4",
    poster: "/media/pancakes.jpg",
  },
  {
    id: "ramen",
    label: "Seasonal · Ramen nights",
    title: "Ramen",
    note: "Chicken paitan, ajitama egg, nori",
    text: "A creamy bowl for the evenings when Aljada cools down. Served on special nights — ask the team what’s on.",
    video: "/media/ramen.mp4",
    poster: "/media/ramen.jpg",
  },
  {
    id: "tea",
    label: "Green drinks",
    title: "Sencha green tea",
    note: "Served in glass",
    text: "Clear and grassy, poured slowly. Or try the house Sabaku Matcha — iced camel milk matcha latte infused with desert flavours.",
    price: 20,
    video: "/media/sencha.mp4",
    poster: "/media/sencha.jpg",
  },
] as const;

export const PLACE = {
  address: "Aljada, Boulevard 3 — South Avenue, Muwaileh Commercial, Sharjah",
  hours: "Open daily until 12 AM",
  rating: "4.7 on Google · 602 reviews",
  mapsUrl:
    "https://www.google.com/maps/place/Sabaku/@25.3117726,55.4739062,20z/data=!4m6!3m5!1s0x3e5f5f320b9a1899:0x5815b6633d8c7689!8m2!3d25.3117542!4d55.4737907!16s%2Fg%2F11vy07fb21",
};
