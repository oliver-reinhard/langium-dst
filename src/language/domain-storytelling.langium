grammar DomainStorytelling

interface Model {
    name: string
}
interface IconLibrary extends Model {
    icons: Icon[]
}
interface DeclarationScope extends Model {
    declarations: ResourceDeclaration[]
}
interface StoryBook extends DeclarationScope { 
    library: @IconLibrary
}
interface Story extends DeclarationScope { 
    book: @StoryBook
    rule: BooleanExpression
    activities: Activity[]
    goal: BooleanExpression
    footnotes: Footnote[]
}

interface ResourceDeclaration {
    name: string
    plural?: string
    icon: @Icon
    description?: string
}
interface AgentDeclaration extends ResourceDeclaration { }
interface WorkObjectDeclaration extends ResourceDeclaration { }

interface ExpressionClause {
    text? : string
    resource?: Resource
}


interface Activity { }

interface AgentActivity extends Activity {
    initiator: Agent
    clauses: AgentActivityClause[]
}

interface StoryDelegation extends Activity {
    story: @Story
}

interface AgentActivityClause {
    connector: Connector
    resource: Resource  // work object or agent (=recipient)
    moreRecipients: Agent[]
}

interface Resource { 
    declaration: @ResourceDeclaration
    plural: boolean
    footnoteLinks?: FootnoteLinks
}
interface Agent extends Resource { }
interface WorkObject extends Resource { }

interface Connector {
    name?: string
    label?: string
    footnoteLinks?: FootnoteLinks
}

//
// -------- Grammar ---------
//
entry Entry:
    IconLibrary |  StoryBook | Story;

// ---
IconLibrary returns IconLibrary:
    'icon' 'library' name=ID 
    'define' (icons+=Icon)*;

Icon:
    'icon' name=ID 
    ('url' ':' url=STRING)?;

// ---
StoryBook returns StoryBook:
    'book' name=ID 
    'use' library=[IconLibrary:ID]
    ('introduce' ResourceDeclarations)?;

// ---
Story returns Story:
    'story' name=ID 
    'for' 'book' book=[StoryBook:ID]
    ('introduce' ResourceDeclarations)?
    ('await' rule=BooleanExpression?)?
    'act' (activities+=Activity)*
    ('accomplish' goal=BooleanExpression?)?
    ('footnotes' footnotes+=Footnote+)?;

fragment ResourceDeclarations:
    declarations+=(AgentDeclaration | WorkObjectDeclaration)*;

AgentDeclaration returns AgentDeclaration:
    'agent' Declaration;

WorkObjectDeclaration returns WorkObjectDeclaration:
    'work' 'object' Declaration;

fragment Declaration:
    name=ID ('plural' ':' plural=ID)? 'icon' ':' icon=[Icon:ID] ('description' ':' description=STRING)?;

// ---
BooleanExpression:
    // conjunctions+=Conjunction ('OR' conjunctions+=Conjunction)*;
    (andTerm+=AndTerm)+;

Conjunction:
    (andTerm+=AndTerm)+;

AndTerm:
    '+' ( clauses+=ExpressionText (clauses+=ExpressionResource clauses+=ExpressionText)* clauses+=ExpressionResource? 
        | clauses+=ExpressionResource (clauses+=ExpressionText clauses+=ExpressionResource)* clauses+=ExpressionText?);

ExpressionText returns ExpressionClause:
    text=STRING;

ExpressionResource returns ExpressionClause:
    resource=Resource;


// ---
Activity returns Activity:
    AgentActivity | StoryDelegation;

AgentActivity returns AgentActivity:
    '-' initiator=Agent (clauses+=AgentActivityClause)+;

StoryDelegation returns StoryDelegation:
    '-' 'story' story=[Story];

AgentActivityClause returns AgentActivityClause:
    // only the last clause in an activity can have multiple recipients AND only if the resource of the clause is an Agent
    connector=Connector resource=Resource ('&' moreRecipients+=Agent)*;

Agent returns Agent:
    declaration=[AgentDeclaration:ID] (plural?='*')?
    footnoteLinks=FootnoteLinks?;

// work object or agent (=recipient)
Resource returns Resource: 
    declaration=[ResourceDeclaration:ID] (plural?='*')?
    footnoteLinks=FootnoteLinks?;

Connector returns Connector:
    (name=ID | label=STRING)
    footnoteLinks=FootnoteLinks?;

// ---
Footnote:
    name=INDEX ':' text=STRING;

FootnoteLinks:
   '(' links+=[Footnote:INDEX] (',' links+=[Footnote:INDEX])* ')';

// ---
hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
// original: terminal INT returns number: /[0-9]+/;
terminal INDEX returns string: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
