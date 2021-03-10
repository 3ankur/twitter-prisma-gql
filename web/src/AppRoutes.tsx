import React from "react";
import { BrowserRouter , Route, Switch} from "react-router-dom";
import IsAuthenticated from "./components/isAuthenticated";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

function AppRoutes(){

    return(
        <BrowserRouter>
        <Switch>
          <Route path="/" exact component={HomePage} />
          <Route path="/signup" exact component={SignupPage} />
          <Route path="/login" exact component={LoginPage} />
          <IsAuthenticated>
            <Route path="/posts" exact component={HomePage}/>
          </IsAuthenticated>
        </Switch>
      </BrowserRouter>
    )
}
export default AppRoutes;