import {no,nc,lm,sw,pb,par,R,NOTE} from './dsl.js';

// The four sheets of the wiring diagram, written with the helpers in dsl.js.
// Pure data: draw.js turns it into SVG, and updateSchematic lights it as the mouse runs.
//
//   Sheet 1  Sensing and selection   whiskers, centring, square selector, heading
//   Sheet 2  Mode and sequence       run, explore/goal strategy, SQ1 → SQ2 → SQ3, write
//   Sheet 3  Drive                   electromagnet, turn motor, drive motors, bell
//   Sheet 4  Memory cell             two memory relays + mismatch, for one square
export const SHEETS=[
 {title:'Sensing and selection',inputs:'Inputs on the machine: <b>W</b> whisker touching a partition · <b>G</b> whisker touching the goal pin · <b>CX, CY</b> centring cams on the carriage · <b>XA–XE, Y1–Y5</b> commutator segments, one per column and row · <b>HN, HE, HS, HW</b> heading cams on the turning shaft.',
  rungs:[
  R('Whisker touches a partition',[sw('W')],'WSK'),
  R('Whisker touches the goal pin',[sw('G')],'BELL'),
  R('Carriage centred in a square: both centring cams closed',[sw('CX'),sw('CY')],'CTR'),
  R('Column selector: commutator segment under the carriage',[sw('XA')],'CA'),
  NOTE('CB, CC, CD are wired the same from segments XB, XC, XD'),
  R('',[sw('XE')],'CE'),
  R('Row selector',[sw('Y1')],'R1'),
  NOTE('R2, R3, R4 are wired the same from segments Y2, Y3, Y4'),
  R('',[sw('Y5')],'R5'),
  R('Heading bit 1: cam closed facing south or west',[par([sw('HS')],[sw('HW')])],'D1'),
  R('Heading bit 0: cam closed facing east or west',[par([sw('HE')],[sw('HW')])],'D0'),
 ]},
 {title:'Mode and sequence',inputs:'Pushbuttons: <b>PB-EX</b> start exploring · <b>PB-GL</b> start a goal run · <b>PB-STOP</b> stop · <b>PB-CLR</b> clear memory.',
  rungs:[
  R('Run holding circuit: either start button, held until the bell rings or Stop',[par([pb('PB-EX')],[pb('PB-GL')],[no('HOLD')]),nc('BELL'),pb('PB-STOP','nc')],'HOLD'),
  R('Exploration strategy: start button, or a wall met while following memory',[par([pb('PB-EX')],[no('GOAL'),no('WSK')],[no('EXPL'),pb('PB-GL','nc'),no('HOLD')])],'EXPL'),
  R('Goal strategy: follow memory until a wall is met',[par([pb('PB-GL')],[no('GOAL'),nc('EXPL'),no('HOLD')])],'GOAL'),
  R('Step 1, load: mouse centred and no other step running',[no('HOLD'),no('CTR'),nc('SQ2'),nc('SQ3'),nc('BACK'),nc('LEFT')],'SQ1','SR'),
  R('Read memory during step 1',[no('SQ1'),nc('SQ2')],'RD'),
  R('Step 2, turn: shaft now matches memory, or the mouse has backed home from a wall',[par([no('SQ1'),lm('RD'),nc('MIS'),nc('TURN')],[no('BACK'),no('CTR')],[no('SQ2'),nc('SQ3')]),no('HOLD')],'SQ2'),
  R('Step pulse, one 90° turn: entering step 2 while exploring, or after backing off a wall',[par([no('SQ1'),no('SQ2'),no('EXPL')],[no('BACK'),no('CTR')])],'STEP','SR'),
  R('Step 3, advance: turn finished; held until a wall or the next square',[par([no('SQ2'),nc('STEP'),nc('TURN')],[no('SQ3'),nc('BACK'),par([nc('LEFT')],[nc('CTR')])]),no('HOLD')],'SQ3'),
  R('Carriage has left the centre of the square',[no('SQ3'),par([nc('CTR')],[no('LEFT')])],'LEFT'),
  R('Back off: whisker hit a wall; held until the carriage is centred again',[par([no('SQ3'),no('WSK')],[no('BACK'),nc('CTR')])],'BACK','SR'),
  R('Write: store the heading in this square as the carriage departs',[no('SQ3'),no('CTR')],'WR'),
  R('Clear memory',[pb('PB-CLR')],'CLR'),
 ]},
 {title:'Drive',inputs:'<b>DET</b> detent cam, closed at each 90° position of the turning shaft. The motor armatures themselves are switched by contacts of MX, MY and TURN; POL’s changeover contacts reverse both drive motors.',
  rungs:[
  R('Electromagnet holds the mouse while running',[no('HOLD')],'EM'),
  R('Turn motor: run to the stored heading, or one 90° step; held between detents',[par([no('RD'),no('MIS')],[no('STEP')],[no('TURN'),sw('DET','nc')]),no('HOLD')],'TURN'),
  R('East–west motor: heading east or west',[par([no('SQ3')],[no('BACK')]),no('D0')],'MX'),
  R('North–south motor: heading north or south',[par([no('SQ3')],[no('BACK')]),nc('D0')],'MY'),
  R('Polarity: drive east or south, reversed while backing off',[par([no('D1'),nc('D0'),nc('BACK')],[nc('D1'),no('D0'),nc('BACK')],[no('D1'),no('D0'),no('BACK')],[nc('D1'),nc('D0'),no('BACK')])],'POL'),
  R('Goal bell',[no('BELL')],'bell',null,true),
 ]},
 {title:'Memory cell',mem:true,inputs:'Drawn for the square under the carriage. Each of the 25 squares has its own copy of these three rungs, wired through its own column and row contacts, so 25 squares × 2 relays = 50 memory relays. Only the selected square’s C·R contacts close.',
  rungs:[
  R('Bit 1: write D1 into the selected square; otherwise hold',[par([no('WR'),no('Ci'),no('Rj'),no('D1')],[nc('CLR'),par([nc('WR')],[nc('Ci')],[nc('Rj')]),no('M1ij')])],'M1ij','SR'),
  R('Bit 0: write D0 into the selected square; otherwise hold',[par([no('WR'),no('Ci'),no('Rj'),no('D0')],[nc('CLR'),par([nc('WR')],[nc('Ci')],[nc('Rj')]),no('M0ij')])],'M0ij','SR'),
  R('Mismatch: stored heading differs from the turning shaft',[no('RD'),no('Ci'),no('Rj'),par([no('M1ij'),nc('D1')],[nc('M1ij'),no('D1')],[no('M0ij'),nc('D0')],[nc('M0ij'),no('D0')])],'MIS'),
 ]},
];
