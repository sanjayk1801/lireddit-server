import { Context } from "../types/Context";
import { AuthChecker } from "type-graphql";

export const customAuthChecker: AuthChecker<Context> = ({ context }) => {
	// here we can read the user from context
	// and check his permission in the db against the `roles` argument
	// that comes from the `@Authorized` decorator, eg. ["ADMIN", "MODERATOR"]

	if (context.req.session.userId) {
		return true;
	}

	return false; // or false if access is denied
};
