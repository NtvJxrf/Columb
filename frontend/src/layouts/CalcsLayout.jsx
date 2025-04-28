import React, {useState} from 'react';
import { Row, Col, Button } from 'antd'
import ResultsTable from '../components/ResultsTable.jsx';
import History from '../components/History.jsx';
import DynamicForm from '../components/DynamicForm.jsx';
import { formConfigs } from './formConfigs';
import PicturesCarousel from '../components/PicturesCarousel.jsx';
const CalcsLayout = ({type}) => {
    const [results, setResults] = useState({ballons: null, fbort: null, mattress: null});
    const updateResults = (type, value) => {
        setResults(prev => ({
            ...prev,
            [type]: value,
        }));
    };
    const config = formConfigs[type];

    return (
        <>
            <Row align={'middle'} justify={'center'} gutter={20}>
                <Col span={12}>
                    <DynamicForm 
                        fields={config.fields}
                        defaultValues={config.defaultValues}
                        storageKey={config.storageKey}
                        type={config.type}
                        onResults={(newValues) => {
                            updateResults(type, newValues)
                        }}
                    />
                </Col>
                <Col span={12}>
                    <PicturesCarousel type={type}/>
                </Col>
            </Row>
            <Row  justify={'center'} gutter={20} >
                <Col span={12}>
                    <ResultsTable data={results} type={type}/>
                </Col>
                <Col span={12}>
                    <History type={type}/>
                </Col>
            </Row>
        </>
    )
};

export default CalcsLayout