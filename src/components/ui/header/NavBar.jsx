import { useEffect, useState } from "react";
import { NavBarMobileMenuConfiguration, navBarMenuConfiguration, navBarMenuLogoLink } from "./NavBarFunctions";
const NavBar = () => {
    const [ toggleMobileMenu, setToggleMobileMenu ] = useState( false );
    const updateToggleMobile = ( _boolean ) => { setToggleMobileMenu( _boolean ); }
    useEffect( () => { navBarMenuConfiguration(); }, [] )
    return (
        <div className="bbmnavbar">
            <nav className="grid grid-cols-2 px-2 py-6">
                <div className="">{ navBarMenuLogoLink }</div>
                <div className="">{ navBarMenuConfiguration() }</div>
                <div><NavBarMobileMenuConfiguration toggleMobileMenu={ toggleMobileMenu } setToggleMobileMenu={ updateToggleMobile } /></div>
            </nav>
        </div>
    );
};
export default NavBar;