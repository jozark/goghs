import { useState } from "react";
import styles from "./App.module.css";
import Button from "./components/Button/button";
import Image from "./components/Image/image";
import LoadingSpinner from "./components/LoadingSpinner/loadingSpinner";

function App() {
  const [imageurl, setImageurl] = useState(
    "https://media.discordapp.net/attachments/913148795632631838/1071435446627864607/DT1502_cropped2.png"
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleButtonClick = async () => {
    setIsLoading(true);
    const response = await fetch("http://localhost:3001/api/getImage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageurl,
      }),
    });

    const data = await response.json();
    console.log(data);
    setImageurl(data.image_url);
    setIsLoading(false);
  };

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        {isLoading ? <LoadingSpinner /> : <Image source={imageurl} alt="" />}
        <Button type="rectangle" onButtonClick={handleButtonClick}>
          Reimagine
        </Button>
      </div>
    </div>
  );
}

export default App;
