import { navBarMenuTextContainerClass, navBarMenuTextClass, navMobileClosedBtnContainerClass, navMobileClosedBtnClass } from "./NavBarConfig";
import { navMobileModalOpenedClass, navMobileOpenBtnClass, navMobileOpenBtnContainerClass, navMobileIconSize } from "./NavBarConfig";
import { navBarHeaders, navBarHeaderPages } from "./NavBarConfig";
import { VscChromeClose } from "react-icons/vsc";
import { HiMenuAlt4 } from "react-icons/hi";
import { NavLink } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

export const navBarMenuLogoLink = ( 
    <NavLink to="/">
        <div className="flex flex-wrap">
            {/* <div className="logo"/> */}
            <div className="ml-2 bbmNavTextHeader text-left text-[2.0em]">Méabhs Maze</div>
        </div>
    </NavLink>
)

export const NavBarMenuLink = ( { NavBarMenuLink } ) => { return <li className={ navBarMenuTextClass } key={ uuidv4() }>{ NavBarMenuLink }</li>; }
export const navBarMenuScrollControl = ( _top, _left, _behaviour ) => { window.scroll( { top: _top, left: _left, behavior: _behaviour } ); }

export const navBarMenuMap = () => {
    let hrefSplit = window.location.href.split('/');
    let navBarMenuURL = '/' + hrefSplit[ hrefSplit.length-1];
    let navBarMenuIndex = navBarHeaderPages.indexOf( navBarMenuURL );
    let buildHeaderMap = []; buildHeaderMap.length = 0;
    for ( let index = 0; index < navBarHeaders.length; index++ ) {
        if ( index !== navBarMenuIndex ) { buildHeaderMap.push( <NavLink key={ uuidv4() } className={ navBarMenuTextClass } to={ navBarHeaderPages[ index ] } >{ navBarHeaders[ index ] }</NavLink> ); }
    }
    return buildHeaderMap;
}

export const navBarMenuConfiguration = () => {
    const NavBarMenuMap = navBarMenuMap();
    return ( <ul className={ navBarMenuTextContainerClass }>{ NavBarMenuMap.map( ( element, index ) => ( <NavBarMenuLink key={ uuidv4() } NavBarMenuLink={ element } /> ) ) }</ul> )
}

export const NavBarMobileMenuConfiguration = ( { toggleMobileMenu, setToggleMobileMenu } ) => {
    return (
        <div className={ navMobileClosedBtnContainerClass } >
            { toggleMobileMenu ? null : ( <HiMenuAlt4 fontSize={ navMobileIconSize } className={ navMobileClosedBtnClass } onClick={ () => setToggleMobileMenu( true ) } /> ) }
            { toggleMobileMenu && (
                <ul key={ uuidv4() } className={ navMobileModalOpenedClass } onMouseLeave={ ( event ) => { setToggleMobileMenu( false ); } }>
                    <li key={ uuidv4() } className={ navMobileOpenBtnContainerClass }><VscChromeClose fontSize={ navMobileIconSize } className={ navMobileOpenBtnClass } onClick={ () => setToggleMobileMenu( false ) } /></li>
                    { navBarMenuMap().map( ( element, index ) => ( <div key={ uuidv4() }><NavBarMenuLink key={ uuidv4() } NavBarMenuLink={ element } /></div> ) ) }
                </ul>
            ) }
        </div>
    )
}