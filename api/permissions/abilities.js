const { AbilityBuilder, Ability, defineAbility } = require("@casl/ability");

let ANONYMOUS_ABILITY;

defineAbilityFor = (user) => {
  if (user) {
    return new Ability(defineRulesFor(user));
  }
  ANONYMOUS_ABILITY = ANONYMOUS_ABILITY || new Ability(defineRulesFor({}));
  return ANONYMOUS_ABILITY;
};

function defineRulesFor(user) {
  const builder = new AbilityBuilder(Ability);
  switch (user.rule) {
    case "admin":
      defineAdminRules(builder, user);
      break;
    case "editor":
      defineEditorRules(builder, user);
    case "manager":
      defineManagerRules(builder, user);
      break;
    case "user":
      defineUserRules(builder, user);
      break;
    default:
      defineAnonymousRules(builder, user);
      break;
  }
  return builder.rules;
}

function defineAdminRules({ can }) {
  can("manage", "all");
}
function defineEditorRules({ can, cannot }, user) {
  can(["read", "update"], ["User"], { _id: user._id });
  can(["read", "update", "modify"], ["Post"], { user: user._id });
  can(["read", "update", "modify"], "Setting");
}

function defineManagerRules({ can, cannot }, user) {
  can(["read", "update"], ["User"], { _id: user._id });
  can(["read", "update", "modify"], ["Post"]);
}

function defineUserRules({ can, cannot }, user) {
  can(["read", "update"], ["User"], { _id: user._id });
  can(["read", "update", "modify"], ["Post"], { user: user._id });
}

function defineAnonymousRules({ can }) {
  can("read", ["User"]);
}

module.exports = defineAbilityFor;
