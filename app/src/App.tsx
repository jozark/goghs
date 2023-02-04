import { useState } from "react";
import styles from "./App.module.css";
import Button from "./components/Button/button";
import Image from "./components/Image/image";

function App() {
  const [imageUrl, setImageUrl] = useState(
    "https://media.discordapp.net/attachments/913148795632631838/1071435446627864607/DT1502_cropped2.png"
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleButtonClick = async () => {
    const response = await fetch("http://localhost:3000/api/getImage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl,
      }),
    });

    const data = await response.json();
    setImageUrl(data);
    console.log(data);
  };

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <Image source={imageUrl} alt=""></Image>
        <Button type="rectangle" onButtonClick={handleButtonClick}>
          Reimagine
        </Button>
      </div>
    </div>
  );
}

export default App;
