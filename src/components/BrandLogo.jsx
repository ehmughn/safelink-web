import BrandIcon from "../assets/logo.png";
import "../styles/BrandLogo.css";

const BrandLogo = (props) => {
  return (
    <div className="brand-logo-div">
      <img src={BrandIcon} alt="Brand Icon" />
      <p style={{ color: props.safe }}>Safe</p>
      <p style={{ color: props.link }}>Link</p>
    </div>
  );
};

export default BrandLogo;
