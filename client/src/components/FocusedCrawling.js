import React, { Component } from 'react';
import { Col, Row} from 'react-bootstrap';
// From https://github.com/oliviertassinari/react-swipeable-views
import Terms from './Terms';
import ScaleBar from './ScaleBar';
import { InputGroup, FormControl , DropdownButton} from 'react-bootstrap';
import RaisedButton from 'material-ui/RaisedButton';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import Checkbox from 'material-ui/Checkbox';
import Divider from 'material-ui/Divider';
import MenuItem from 'material-ui/MenuItem';
import Avatar from 'material-ui/Avatar';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import CommunicationChatBubble from 'material-ui/svg-icons/communication/chat-bubble';
import Monitoring from './Monitoring.js';
import Dialog from 'material-ui/Dialog';
import {
  Table,
  TableBody,
  TableFooter,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';

import $ from 'jquery';


const styles = {

  card: {
    borderStyle: 'solid',
    borderColor: '#C09ED7',
    background: 'white',
    borderRadius: '0px 0px 0px 0px',
    borderWidth: '0px 0px 0px 0px'
  },
  avatar:{
    margin:'-4px 8px 0px 0px',
  },
  cardHeader:{
    background: "white", //'#DCCCE7',
    padding:'10px 1px 10px 6px',
    borderRadius: '0px 0px 0px 0px',
  },
  cardMedia:{
    background: "white",
    padding:'2px 4px 2px 4px',
    borderRadius: '0px 0px 0px 0px',
    height: "382px",
  },
};


class FocusedCrawling extends Component {

  constructor(props) {
    super(props);
      this.state = {
      slideIndex: 0,
      pages:{},
      currentTags:undefined,
      selectedPosTags: ["Relevant"],
      selectedNegTags: ["Irrelevant"],
      session:{},
      loadTerms:false,
      disableStopCrawlerSignal:true,
      disableAcheInterfaceSignal:true,
      disabledCreateModel:true, //false
      disabledStartCrawler:false, //false
      messageCrawler:"",
      open:false,
      openDialog:false,
      anchorEl:undefined,
      termsList: [],
      accuracyOnlineLearning:0,
    };

  }



  /**
  * Set
  * @method componentWillMount
  * @param
  */
  componentWillMount(){
      var temp_session = this.props.session;
      this.getAvailableTags(this.props.session);
      this.getModelTags(this.props.domainId);


  }
  componentWillReceiveProps  = (newProps, nextState) => {

  }

  setSelectedPosTags(selectedPosTags){

  }

  loadingTerms(session, selectedPosTags){

      var temp_session = session;
      temp_session['newPageRetrievalCriteria'] = "one";
      temp_session['pageRetrievalCriteria'] = "Tags";
      temp_session['selected_tags']=this.state.selectedPosTags.join(',');
      this.setState({session: temp_session, selectedPosTags: selectedPosTags, loadTerms:true});
      this.forceUpdate();
  }

  updateTerms(terms){
      this.setState({termsList: terms});
  }

  getAvailableTags(session){
    $.post(
      '/getAvailableTags',
      {'session': JSON.stringify(session), 'event': 'Tags'},
      function(tagsDomain) {
        this.setState({currentTags: tagsDomain['tags']}); //, session:this.props.session, tagString: JSON.stringify(this.props.session['selected_tags'])});
        this.forceUpdate();
      }.bind(this)
    );
  }

  getModelTags(domainId){
    $.post(
      '/getModelTags',
      {'domainId': domainId},
	function(tags){
	    var session = this.props.session;
	    session['model']['positive'] = [];
	    session['model']['negative'] = [];
            if(Object.keys(tags).length > 0){
		session['model']['positive'] = tags['positive'].slice();
		session['model']['negative'] = tags['negative'].slice();

		//setting session info for generating terms.
		session['newPageRetrievalCriteria'] = "one";
		session['pageRetrievalCriteria'] = "Tags";
		session['selected_tags']=(tags['positive'].slice()).join(',');

		this.setState({session: session, selectedPosTags: tags['positive'].slice(), selectedNegTags: tags['negative'].slice(), loadTerms:true});
		this.forceUpdate();

            }
            else {if(!(session['model']['positive'].length>0)){
		this.setState({loadTerms:false,});
		this.forceUpdate();
            }}

	}.bind(this)
    );
  }

  handleSaveTags() {
    var session = this.props.session;
    console.log(session['model']);
    session['model']['positive'] = this.state.selectedPosTags.slice();
    session['model']['negative'] = this.state.selectedNegTags.slice();
    //this.setState({session: session, selectedPosTags: this.state.selectedPosTags.slice(),});
    console.log(session['model']['positive'].length);
    if(session['model']['positive'].length>0 ){
      this.loadingTerms(session, this.state.selectedPosTags);
    }
    else{
      this.setState({openDialog:true, loadTerms:false});
    }
    this.updateOnlineClassifier(session);


      $.post(
        '/saveModelTags',
        {'session': JSON.stringify(session)},
        function(update){
          //this.forceUpdate();
        }.bind(this)
      );
    }

  handleCancelTags(){
    this.setState({selectedPosTags: this.state.session['model']['positive'].slice(), selectedNegTags: this.state.session['model']['negative'].slice()})
    this.forceUpdate();

  }

  addPosTags(tag){
      var tags = this.state.selectedPosTags;
    if(tags.includes(tag)){
      var index = tags.indexOf(tag);
      tags.splice(index, 1);
    }
    else{
      tags.push(tag);
    }
    this.setState({selectedPosTags: tags})
    this.forceUpdate();
  }

  addNegTags(tag){
    var tags = this.state.selectedNegTags;
    if(tags.includes(tag)){
      var index = tags.indexOf(tag);
      tags.splice(index, 1);
    }
    else{
      tags.push(tag);
    }
    this.setState({selectedNegTags: tags})
    this.forceUpdate();
  }


  startFocusedCrawler =()=>{
    this.startCrawler("focused");
    this.forceUpdate();
  }

  startCrawler(type){
    var session = JSON.parse(JSON.stringify(this.state.session));
    var message = "Running";
    this.setState({disableAcheInterfaceSignal:false, disableStopCrawlerSignal:false, disabledStartCrawler:true, messageCrawler:message});
    this.forceUpdate();

    var terms = [];
    var pos_terms = [];
    terms = pos_terms = this.state.termsList.map((term)=>{
	if(term['tags'].indexOf('Positive') !== -1)
	    return term['word'];
    }).filter((term)=>{return term !== undefined});

    if(pos_terms.length === 0){
	terms = this.state.termsList.map((term)=>{
	    return term['word']
	});
    }

    $.post(
        '/startCrawler',
        {'session': JSON.stringify(session),'type': type },
        function(message) {
          var disableStopCrawlerFlag = false;
          var disableAcheInterfaceFlag = false;
          var disabledStartCrawlerFlag = true;
          if(message.toLowerCase() !== "running"){
        disableStopCrawlerFlag = true;
        disableAcheInterfaceFlag =true;
        disabledStartCrawlerFlag = true;
          }

          this.setState({ disableAcheInterfaceSignal: disableAcheInterfaceFlag, disableStopCrawlerSignal:disableStopCrawlerFlag, disabledStartCrawler:disabledStartCrawlerFlag, messageCrawler:message});
          this.forceUpdate();
        }.bind(this)
    );
  }

   stopFocusedCrawler(event) {
     this.stopCrawler("focused");
   }


   stopCrawler(type){
     var session = this.props.session;
     var message = "Terminating";
     this.setState({disableAcheInterfaceSignal:true, disableStopCrawlerSignal:true, disabledStartCrawler:true, messageCrawler:message,});
     this.forceUpdate();
     $.post(
       '/stopCrawler',
       {'session': JSON.stringify(session), 'type' : type  },
	 function(message) {
           this.setState({disableAcheInterfaceSignal:true, disableStopCrawlerSignal:true, disabledStartCrawler: false, messageCrawler:"",});
         this.forceUpdate();
       }.bind(this)
   ).fail((error) => {
      this.setState({disabledStartCrawler: false});
   });
   }
   handleRequestClosePopOver(){
     this.setState({open:false});
   }
   handleExport(event){
     this.setState({open:true,anchorEl:event.currentTarget})
   }
   handleOpenMenu = () => {
    this.setState({
      openMenu: true,
    });
  }
  handlecloseDialog(){
    this.setState({openDialog:false});
    this.forceUpdate();
  }
  handleOnRequestChange = (value) => {
    this.setState({
      openMenu: value,
    });
  }


  //////////////////////
  /////////////////////
  updateOnlineClassifier(sessionTemp){
    console.log(" ONLINE CLASSIFIER");
    $.post(
      '/updateOnlineClassifier',
      {'session':  JSON.stringify(sessionTemp)},
      function(accuracy) {
          this.setState({accuracyOnlineLearning:accuracy,});
          this.forceUpdate();
    }.bind(this)
    );
  }
///////////////////////
//////////////////////
  render() {
    var total_selectedPosTags=0;
    var total_selectedNegTags=0;
    var ratioPosNeg =0;
    var ratioAccuracy=0;
    var checkedTagsPosNeg = (this.state.currentTags!==undefined) ?
                          <Row style={{height:330, overflowY: "scroll", }}>
                          <Col xs={6} md={6} style={{marginTop:'2px'}}>
                          Positive
                          {Object.keys(this.state.currentTags).map((tag, index)=>{
                            var labelTags=  tag+" (" +this.state.currentTags[tag]+")";
                            var checkedTag=false;
                            var tags = this.state.selectedPosTags;
                            if(tags.includes(tag)){
                                checkedTag=true;
                                total_selectedPosTags=total_selectedPosTags +this.state.currentTags[tag];
                            }
                            return <Checkbox label={labelTags} checked={checkedTag}  onClick={this.addPosTags.bind(this,tag)} />
                          })}
                          </Col>
                          <Col xs={6} md={6} style={{marginTop:'2px'}}>
                          Negative
                            {Object.keys(this.state.currentTags).map((tag, index)=>{
                              var labelTags=  tag+" (" +this.state.currentTags[tag]+")";
                              var checkedTag=false;
                              var tags = this.state.selectedNegTags;
                              if(tags.includes(tag)){
                                checkedTag=true;
                                total_selectedNegTags=total_selectedNegTags+this.state.currentTags[tag];
                              }
                              return <Checkbox label={labelTags} checked={checkedTag}  onClick={this.addNegTags.bind(this,tag)} />
                              })}
                          </Col>
                        </Row>:<div />;

    ratioPosNeg = total_selectedPosTags/total_selectedNegTags;
    ratioAccuracy = ratioPosNeg*this.state.accuracyOnlineLearning;
    var DialogBox= <RaisedButton disabled={false} onTouchTap={this.handlecloseDialog.bind(this)} style={{ height:20, marginTop: 15, marginRight:10, minWidth:118, width:118}} labelStyle={{textTransform: "capitalize"}} buttonStyle={{height:19}}
      label="Close" labelPosition="before" containerElement="label" />;
    var renderTerms = (this.state.loadTerms)?<Terms statedCard={true} sizeAvatar={20} setActiveMenu={true} showExpandableButton={false} actAsExpander={false}
                                                    BackgroundColorTerm={"white"} renderAvatar={false} session={this.state.session}
      focusedCrawlDomains={this.state.loadTerms} fromCrawling={true} updateTerms={this.updateTerms.bind(this)}/>
    :<div></div>;
    var openMessage = (this.props.slideIndex && this.state.openDialog)?true:false;
    return (
      <div>
      <Row>
        <Col xs={11} md={11} style={{margin:'10px'}}>
        <Card id={"Settings"} initiallyExpanded={true} style={{paddingBottom:0,}} containerStyle={{paddingBottom:0,}} >
         <CardHeader
           title="Model Settings"
           actAsExpander={false}
           showExpandableButton={false}
           style={{fontWeight:'bold', padding:'10px 1px 10px 6px', borderRadius: '0px 0px 0px 0px',}}
         />
         <CardText expandable={true} style={{padding:'1px 16px 0px 16px',}}>
           <Row>
             <Col xs={7} md={7} style={{margin:0, padding:0,}}>
               <Card id={"Tags"} initiallyExpanded={true} style={styles.card}>
                <CardHeader
                  title="Select postive and negative examples."
                  actAsExpander={false}
                  showExpandableButton={false}
                  style={styles.cardHeader}
                />
                <CardText expandable={true} style={styles.cardMedia}>


                <Divider/>
                  <Row style={{margin:"5px 5px 10px 20px"}} title="Model Settings">
                    {checkedTagsPosNeg}
                  </Row>
                  <Row style={{margin:"-8px 5px 10px 20px"}}>
                    <RaisedButton disabled={false} onTouchTap={this.handleSaveTags.bind(this)} style={{ height:20, marginTop: 15, marginRight:10, minWidth:118, width:118}} labelStyle={{textTransform: "capitalize"}} buttonStyle={{height:19}}
                      label="Save" labelPosition="before" containerElement="label" />
                    <RaisedButton disabled={false} onTouchTap={this.handleCancelTags.bind(this)} style={{ height:20, marginTop: 15, minWidth:118, width:118}} labelStyle={{textTransform: "capitalize"}} buttonStyle={{height:19}}
                      label="Cancel" labelPosition="before" containerElement="label" />
                  </Row>
                  <Dialog title="Select positive tags to extract terms." open={openMessage}>
                  {DialogBox}</Dialog>
                </CardText>
                </Card>
             </Col>
             <Col xs={5} md={5} style={{margin:0, padding:0,}}>
             {renderTerms}
               </Col>
           </Row>


         </CardText>
        </Card>
        </Col>
      </Row>

      <Row>
       <Col xs={5} md={5} style={{margin:'10px'}}>
       <Card id={"Crawling"} initiallyExpanded={true} >
        <CardHeader
          title="Crawling"
          actAsExpander={false}
          showExpandableButton={false}
          style={{fontWeight:'bold',}}
        />
        <CardText expandable={true} >
        <div style={{display: 'flex'}}>
        <div>
          <RaisedButton
            label="Start Crawler"
            style={{margin: 5}}
            disable={this.state.disabledStartCrawler}
            labelStyle={{textTransform: "capitalize"}}
            style={
                    this.state.disabledStartCrawler ?
                    {pointerEvents: 'none', opacity: 0.5, margin: 12}
                    :
                    {pointerEvents: 'auto', opacity: 1.0, margin: 12}
                  }
            onClick={this.startFocusedCrawler.bind(this)}
          />
          </div>
          {
            this.state.disabledStartCrawler ?
            <div style={{float:'right'}}>
              <RaisedButton
                label="Stop Crawler"
                style={{margin: 5,}}
                labelStyle={{textTransform: "capitalize"}}
                onClick={this.stopFocusedCrawler.bind(this)}
              />
              <br/>
              <RaisedButton
                label="Crawler Monitor"
                style={{margin: 5}}
                labelStyle={{textTransform: "capitalize"}}
                href="http://localhost:8080/monitoring" target="_blank"
              />

            </div>
            :
            null
          }
        </div>
        </CardText>
        </Card>
        </Col>

        <Col xs={6} md={6} style={{margin:'10px', marginLeft:"-10px",}}>
        <Card id={"Model"} initiallyExpanded={true} >
         <CardHeader
           title="Model"
           actAsExpander={false}
           showExpandableButton={false}
           style={{fontWeight:'bold'}}
         />
         <CardText expandable={true} style={{marginTop:"-12px", paddingTop:0,}}>
            <p><span style={{marginRight:10,}}>Relevant: </span>{total_selectedPosTags} </p>
            <p><span style={{marginRight:10,}}>Irrelevant: </span>{total_selectedNegTags} </p>
            <p><span>Domain Model (Accuracy): </span> {this.state.accuracyOnlineLearning} %</p>
            <Divider />
            <div style={{marginLeft:10, marginTop:10,}}>
              <ScaleBar ratioAccuracy={ratioAccuracy}/>
            </div>
            <div style={{marginTop:"-20px",}}>
              <IconMenu
               iconButtonElement={ <RaisedButton onTouchTap={this.handleOpenMenu} label="Export" />} >
               <MenuItem value="1" primaryText="Create Model" />
               <MenuItem value="2" primaryText="Settings" />
             </IconMenu>
            </div>
         </CardText>
         </Card>
        </Col>
       </Row>
        </div>
    );
  }
}

export default FocusedCrawling;
