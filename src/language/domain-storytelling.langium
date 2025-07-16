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
    sentences: Sentence[];
    notes: Note[];
}

interface ResourceDeclaration {
    name: string;
    icon: @Icon;
    description?: string;
}
interface AgentDeclaration extends ResourceDeclaration { }
interface WorkObjectDeclaration extends ResourceDeclaration { }

interface Resource { }
interface Agent extends Resource { 
    agent: @AgentDeclaration;
}
interface WorkObject extends Resource {
    activity: Activity;
    resource: @ResourceDeclaration;
}

entry Model:
    file=(IconLibrary |  StoryBook | Story);

IconLibrary returns IconLibrary:
    'icon' 'library' name=ID 
    'define' (icons+=Icon)*;

Icon:
    'icon' name=ID 
    ('url' ':' url=STRING)? ';';

StoryBook returns StoryBook:
    'book' name=ID 
    'use' library=[IconLibrary:ID]
    Declarations;

Story returns Story:
    'story' name=ID 
    'for' 'book' book=[StoryBook:ID]
    Declarations  
    'tell' (sentences+=Sentence)*
    notes+=Note*;

fragment Declarations:
    'introduce' declarations+=(AgentDeclaration | WorkObjectDeclaration)* ;


AgentDeclaration returns AgentDeclaration:
    'agent' Declaration;

WorkObjectDeclaration returns WorkObjectDeclaration:
    'work' 'object' Declaration;

fragment Declaration:
    name=ID 'icon' ':' icon=[Icon:ID] ('description' ':' description=STRING)? ';'; 

Sentence:
    '-' initiator=[AgentDeclaration:ID] workObjects+=WorkObjectActivity (workObjects+=ResourceActivity)* ';';

Activity:
    name=ID | label=STRING;

WorkObjectActivity returns WorkObject:
    activity=Activity resource=[WorkObjectDeclaration:ID];

ResourceActivity returns WorkObject:
    activity=Activity resource=[ResourceDeclaration:ID];

Note:
    'note' text=STRING 
    (connectors+=Connector)+ ';';

Connector:
   '-->' resource=[Resource:ID];

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
