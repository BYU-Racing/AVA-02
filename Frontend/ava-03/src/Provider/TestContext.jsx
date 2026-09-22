import React from "react";
import { useContext } from 'react';

const MyContext = React.createContext(null);


function TestProvider({children}) {
    return(
        <MyContext.Provider value={"hello there"}>
            {children}
        </MyContext.Provider>
    )
}

function useTestContext() {
    const context = useContext(MyContext);
    if(context===null) {
        console.error("useTestContext must be used within a TestProvider");
    } else {
        return context;
    }
}

export { useTestContext };
export { TestProvider };