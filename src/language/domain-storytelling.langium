grammar DomainStorytelling

interface File {
    name: string;
}
interface IconLibrary extends File {
    icons: Icon[];
}
interface DeclarationScope extends File {
    declarations: ResourceDeclaration[];
}
interface StoryBook extends DeclarationScope { 
    library: @IconLibrary;
}
interface Story extends DeclarationScope { 
    book: @StoryBook;
    activities: Activity[];
    footnotes: Footnote[];
}

interface ResourceDeclaration {
    name: string;
    icon: @Icon;
    description?: string;
}
interface AgentDeclaration extends ResourceDeclaration { }
interface WorkObjectDeclaration extends ResourceDeclaration { }

interface Activity {
    initiator: Agent;
    clauses: ActivityClause[];
}

interface ActivityClause {
    connector: Connector;
    resource: Resource;  // work object or agent (=recipient)
    moreRecipients: Agent[];
}

interface Resource { 
    declaration: @ResourceDeclaration;
    footnoteLinks?: FootnoteLinks;
}
interface Agent extends Resource { }
interface WorkObject extends Resource { }

interface Connector {
    name?: string;
    label?: string;
    footnoteLinks?: FootnoteLinks;
}

//
// -------- Grammar ---------
//
entry Model:
    file=(IconLibrary |  StoryBook | Story);

IconLibrary returns IconLibrary:
    'icon' 'library' name=ID 
    'define' (icons+=Icon)*;

Icon:
    'icon' name=ID 
    ('url' ':' url=STRING)?;

StoryBook returns StoryBook:
    'book' name=ID 
    'use' library=[IconLibrary:ID]
    ResourceDeclarations?;

Story returns Story:
    'story' name=ID 
    'for' 'book' book=[StoryBook:ID]
    ResourceDeclarations?
    'tell' (activities+=Activity)*
    ('footnotes' footnotes+=Footnote+)?;

fragment ResourceDeclarations:
    'introduce' declarations+=(AgentDeclaration | WorkObjectDeclaration)+;

AgentDeclaration returns AgentDeclaration:
    'agent' Declaration;

WorkObjectDeclaration returns WorkObjectDeclaration:
    'work' 'object' Declaration;

fragment Declaration:
    name=ID 'icon' ':' icon=[Icon:ID] ('description' ':' description=STRING)?; 

Activity returns Activity:
    '-' initiator=Agent (clauses+=ActivityClause)+;

ActivityClause returns ActivityClause:
    // only the last clause in an activity can have multiple recipients AND only, if the resource of the clause is an Agent
    connector=Connector resource=Resource ('&' moreRecipients+=Agent)*;

Agent returns Agent:
    declaration=[AgentDeclaration:ID]
    footnoteLinks=FootnoteLinks?;

// work object or agent (=recipient)
Resource returns Resource: 
    declaration=[ResourceDeclaration:ID]
    footnoteLinks=FootnoteLinks?;

Connector returns Connector:
    (name=ID | label=STRING)
    footnoteLinks=FootnoteLinks?;

Footnote:
    name=INDEX ':' text=STRING;

FootnoteLinks:
   '(' links+=[Footnote:INDEX] (',' links+=[Footnote:INDEX])* ')';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
// terminal INT returns number: /[0-9]+/;
terminal INDEX: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
